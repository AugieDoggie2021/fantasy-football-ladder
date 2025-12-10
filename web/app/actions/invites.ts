'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUserWithProfile, isGlobalAdmin } from '@/lib/auth-roles'
import { randomBytes } from 'crypto'
import { sendLeagueInviteEmail } from '@/lib/email'
import { trackInviteSent, trackInviteAccepted } from '@/lib/analytics/server-track'

/**
 * Create a league invite
 * Generates a random token and inserts into league_invites
 */
export async function createLeagueInvite(leagueId: string, email?: string) {
  const supabase = await createClient()
  
  const userWithProfile = await getCurrentUserWithProfile()
  if (!userWithProfile?.user) {
    return { error: 'Not authenticated' }
  }

  const { user } = userWithProfile

  // Verify user is the league commissioner
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, created_by_user_id')
    .eq('id', leagueId)
    .single()

  if (leagueError || !league) {
    return { error: 'League not found' }
  }

  // Check if user is commissioner or global admin
  const isCommissioner = league.created_by_user_id === user.id
  const isAdmin = isGlobalAdmin(userWithProfile.profile)
  
  if (!isCommissioner && !isAdmin) {
    return { error: 'Only league commissioners can create invites' }
  }

  // Validate email format if provided
  if (email && email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return { error: 'Invalid email address format' }
    }

    // Check if user is trying to invite themselves (commissioner)
    const normalizedEmail = email.trim().toLowerCase()
    const userEmail = user.email?.toLowerCase()
    if (userEmail && normalizedEmail === userEmail) {
      return { error: 'You cannot invite yourself. You are already the commissioner of this league.' }
    }

    // Check if there's already a pending or accepted invite for this email
    const { data: existingInvite } = await supabase
      .from('league_invites')
      .select('id, status')
      .eq('league_id', leagueId)
      .eq('email', normalizedEmail)
      .in('status', ['pending', 'accepted'])
      .maybeSingle()

    if (existingInvite) {
      if (existingInvite.status === 'pending') {
        return { error: 'An invite has already been sent to this email address.' }
      }
      if (existingInvite.status === 'accepted') {
        return { error: 'This email address already has a team in this league.' }
      }
    }

    // Note: We can't directly check if a user with this email already has a team
    // because we can't query auth.users. However, the acceptInvite function will
    // prevent duplicate teams by checking owner_user_id when the invite is accepted.
  }

  // Generate a secure random token
  const token = randomBytes(32).toString('hex')

  // Set expiration date (7 days from now, configurable via env)
  const expirationDays = parseInt(process.env.INVITE_EXPIRATION_DAYS || '7')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expirationDays)

  // Get league details for email
  const { data: leagueDetails } = await supabase
    .from('leagues')
    .select('name, created_by_user_id')
    .eq('id', leagueId)
    .single()

  // Get commissioner details for email
  const { data: commissionerProfile } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const commissionerName = commissionerProfile?.display_name || user.email?.split('@')[0] || 'League Commissioner'

  // Verify user authentication context
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser || authUser.id !== user.id) {
    console.error('Auth context mismatch:', { 
      authUserId: authUser?.id, 
      expectedUserId: user.id 
    })
    return { error: 'Authentication context mismatch. Please try logging in again.' }
  }

  // Prepare invite data - ensure email is null if empty string
  const inviteData = {
    league_id: leagueId,
    email: email && email.trim() ? email.trim() : null,
    token,
    status: 'pending' as const,
    created_by: user.id,
    expires_at: expiresAt.toISOString(),
  }

  console.log('Creating invite with data:', { 
    ...inviteData, 
    token: '[REDACTED]',
    userId: user.id,
    leagueId,
    isCommissioner,
    isAdmin
  })

  // Insert invite
  const { data: invite, error: inviteError } = await supabase
    .from('league_invites')
    .insert(inviteData)
    .select('id, token')
    .single()

  if (inviteError) {
    console.error('Invite creation error:', inviteError)
    console.error('Error details:', {
      code: inviteError.code,
      message: inviteError.message,
      details: inviteError.details,
      hint: inviteError.hint,
      userId: user.id,
      leagueId,
      isCommissioner,
      isAdmin
    })
    // Return more descriptive error message
    if (inviteError.code === '23505') {
      return { error: 'An invite with this token already exists. Please try again.' }
    }
    if (inviteError.code === '42501') {
      // More detailed error for permission denied
      return { 
        error: `Permission denied. RLS policy blocked the insert. User: ${user.id}, League: ${leagueId}, Is Commissioner: ${isCommissioner}, Is Admin: ${isAdmin}` 
      }
    }
    return { error: inviteError.message || 'Failed to create invite' }
  }

  if (!invite) {
    return { error: 'Failed to create invite: No data returned' }
  }

  // Construct invite URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fantasyladder.app'
  const inviteUrl = `${baseUrl}/join/${invite.token}`

  // Send email if email is provided
  let emailResult: { success: boolean; error?: string; devMode?: boolean } | null = null
  if (email) {
    try {
      emailResult = await sendLeagueInviteEmail({
        to: email,
        inviteUrl,
        leagueName: leagueDetails?.name || 'Fantasy League',
        commissionerName,
        commissionerEmail: user.email || undefined,
      })

      // Only update invite as sent if email was actually sent (not just logged in dev mode)
      if (emailResult.success && !emailResult.devMode) {
        await supabase
          .from('league_invites')
          .update({
            email_sent_at: new Date().toISOString(),
            email_sent_count: 1,
            last_email_error: null,
          })
          .eq('id', invite.id)
      } else {
        // Email failed or was only logged in dev mode
        await supabase
          .from('league_invites')
          .update({
            last_email_error: emailResult.error || (emailResult.devMode ? 'Email service not configured (dev mode)' : 'Unknown error'),
          })
          .eq('id', invite.id)
      }
    } catch (error: any) {
      // Log error but don't fail invite creation
      console.error('Email sending error:', error)
      await supabase
        .from('league_invites')
        .update({
          last_email_error: error.message || 'Failed to send email',
        })
        .eq('id', invite.id)
    }
  }

  // Track invite sent (non-blocking - don't await)
  trackInviteSent(
    leagueId,
    email || '',
    email ? 'email' : 'link',
    user.id
  ).catch(err => {
    console.error('Error tracking invite sent:', err)
    // Don't block the response if tracking fails
  })

  revalidatePath(`/leagues/${leagueId}`)
  
  return { 
    data: { 
      token: invite.token,
      emailSent: emailResult?.success || false,
      emailError: emailResult?.error,
      devMode: emailResult?.devMode,
    } 
  }
}

/**
 * Get invite by token
 */
export async function getInviteByToken(token: string) {
  const supabase = await createClient()

  const { data: invite, error } = await supabase
    .from('league_invites')
    .select(`
      id,
      league_id,
      email,
      token,
      status,
      created_at,
      expires_at,
      leagues (
        id,
        name,
        max_teams,
        status,
        promotion_groups (
          id,
          name
        ),
        created_by_user_id,
        teams!inner (
          id
        )
      )
    `)
    .eq('token', token)
    .single()

  if (error || !invite) {
    return { error: 'Invite not found' }
  }

  // Check if invite is expired
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { error: 'Invite has expired' }
  }

  // Check if invite is still pending
  if (invite.status !== 'pending') {
    return { error: `Invite has been ${invite.status}` }
  }

  return { data: invite }
}

/**
 * Accept an invite
 * Validates invite, creates a team, and marks invite as accepted
 */
export async function acceptInvite(token: string, teamName: string) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const userId = user.id

  // Get invite
  const inviteResult = await getInviteByToken(token)
  if (inviteResult.error || !inviteResult.data) {
    return { error: inviteResult.error || 'Invalid invite' }
  }

  const invite = inviteResult.data

  // Check if user already has a team in this league
  const { data: existingTeam } = await supabase
    .from('teams')
    .select('id, name')
    .eq('league_id', invite.league_id)
    .eq('owner_user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (existingTeam) {
    return { error: `You already have a team (${existingTeam.name}) in this league. Each user can only have one team per league.`, data: { leagueId: invite.league_id } }
  }

  // Check if league is full
  const league = invite.leagues as any
  const teamCount = Array.isArray(league?.teams) ? league.teams.length : 0
  if (teamCount >= league.max_teams) {
    return { error: 'This league is full' }
  }

  // Create team
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      league_id: invite.league_id,
      owner_user_id: userId,
      name: teamName,
      is_active: true,
    })
    .select('id, league_id')
    .single()

  if (teamError || !team) {
    return { error: 'Failed to create team' }
  }

  // Mark invite as accepted
  const { error: updateError } = await supabase
    .from('league_invites')
    .update({ status: 'accepted' })
    .eq('id', invite.id)

  if (updateError) {
    // Team was created but invite update failed - log but don't fail
    console.error('Failed to update invite status:', updateError)
  }

  // Track invite accepted (non-blocking - don't await)
  trackInviteAccepted(invite.league_id, userId).catch(err => {
    console.error('Error tracking invite accepted:', err)
  })

  revalidatePath(`/leagues/${invite.league_id}`)
  revalidatePath('/dashboard')
  
  return { data: { leagueId: invite.league_id, teamId: team.id } }
}

/**
 * Get all invites for a league (commissioner only)
 * Also fetches teams to show which invites resulted in teams joining
 */
export async function getLeagueInvites(leagueId: string) {
  const supabase = await createClient()
  
  const userWithProfile = await getCurrentUserWithProfile()
  if (!userWithProfile?.user) {
    return { error: 'Not authenticated' }
  }

  const { user, profile } = userWithProfile

  // Verify user is the league commissioner
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, created_by_user_id')
    .eq('id', leagueId)
    .single()

  if (leagueError || !league) {
    return { error: 'League not found' }
  }

  const isCommissioner = league.created_by_user_id === user.id
  const isAdmin = isGlobalAdmin(profile)
  
  if (!isCommissioner && !isAdmin) {
    return { error: 'Only league commissioners can view invites' }
  }

  // Fetch invites
  const { data: invites, error: invitesError } = await supabase
    .from('league_invites')
    .select(`
      id,
      email,
      token,
      status,
      created_at,
      expires_at,
      email_sent_at,
      email_sent_count,
      last_email_error
    `)
    .eq('league_id', leagueId)
    .order('created_at', { ascending: false })

  if (invitesError) {
    console.error('Failed to fetch invites:', invitesError)
    console.error('Error details:', {
      code: invitesError.code,
      message: invitesError.message,
      details: invitesError.details,
      hint: invitesError.hint,
      userId: user.id,
      leagueId,
      isCommissioner,
      isAdmin
    })
    return { error: invitesError.message || 'Failed to fetch invites' }
  }

  // Fetch teams in this league
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      owner_user_id,
      created_at
    `)
    .eq('league_id', leagueId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (teamsError) {
    // Don't fail if teams fetch fails, just log it
    console.error('Failed to fetch teams:', teamsError)
  }

  // Note: We can't easily get user emails from auth.users without admin access
  // For now, we'll show teams without emails and match invites by status only
  const teamsWithEmails = (teams || []).map((team: any) => ({
    ...team,
    users: null, // Email not available without admin access
  }))

  if (teamsError) {
    // Don't fail if teams fetch fails, just log it
    console.error('Failed to fetch teams:', teamsError)
  }

  // Try to match invites to teams
  // Note: We can't match by email easily without admin access to auth.users
  // For now, we'll show accepted invites but won't be able to link them to specific teams
  const invitesWithTeams = (invites || []).map((invite) => {
    // If invite is accepted, we know a team was created, but we can't match it precisely
    // without email access. The teams list will show all teams that joined.
    return {
      ...invite,
      team: null, // Can't match without email access
    }
  })

  return { 
    data: {
      invites: invitesWithTeams,
      teams: teamsWithEmails,
    }
  }
}

/**
 * Revoke an invite
 */
export async function revokeInvite(inviteId: string) {
  const supabase = await createClient()
  
  const userWithProfile = await getCurrentUserWithProfile()
  if (!userWithProfile?.user) {
    return { error: 'Not authenticated' }
  }

  const { user, profile } = userWithProfile

  // Get invite and verify league ownership
  const { data: invite, error: inviteError } = await supabase
    .from('league_invites')
    .select(`
      id,
      league_id,
      leagues!inner (
        id,
        created_by_user_id
      )
    `)
    .eq('id', inviteId)
    .single()

  if (inviteError || !invite) {
    return { error: 'Invite not found' }
  }

  const league = invite.leagues as any
  const isCommissioner = league.created_by_user_id === user.id
  const isAdmin = isGlobalAdmin(profile)
  
  if (!isCommissioner && !isAdmin) {
    return { error: 'Only league commissioners can revoke invites' }
  }

  // Update invite status
  const { error: updateError } = await supabase
    .from('league_invites')
    .update({ status: 'revoked' })
    .eq('id', inviteId)

  if (updateError) {
    return { error: 'Failed to revoke invite' }
  }

  revalidatePath(`/leagues/${invite.league_id}`)
  return { data: { success: true } }
}

/**
 * Resend invite email
 */
export async function resendInviteEmail(inviteId: string) {
  const supabase = await createClient()
  
  const userWithProfile = await getCurrentUserWithProfile()
  if (!userWithProfile?.user) {
    return { error: 'Not authenticated' }
  }

  const { user, profile } = userWithProfile

  // Get invite with league details
  const { data: invite, error: inviteError } = await supabase
    .from('league_invites')
    .select(`
      id,
      email,
      token,
      league_id,
      email_sent_count,
      leagues!inner (
        id,
        name,
        created_by_user_id
      )
    `)
    .eq('id', inviteId)
    .single()

  if (inviteError || !invite) {
    return { error: 'Invite not found' }
  }

  if (!invite.email) {
    return { error: 'This invite has no email address' }
  }

  const league = invite.leagues as any
  const isCommissioner = league.created_by_user_id === user.id
  const isAdmin = isGlobalAdmin(profile)
  
  if (!isCommissioner && !isAdmin) {
    return { error: 'Only league commissioners can resend invites' }
  }

  // Get commissioner details
  const { data: commissionerProfile } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const commissionerName = commissionerProfile?.display_name || user.email?.split('@')[0] || 'League Commissioner'

  // Construct invite URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fantasyladder.app'
  const inviteUrl = `${baseUrl}/join/${invite.token}`

  // Send email
  const emailResult = await sendLeagueInviteEmail({
    to: invite.email,
    inviteUrl,
    leagueName: league.name,
    commissionerName,
    commissionerEmail: user.email || undefined,
  })

  // Only update invite as sent if email was actually sent (not just logged in dev mode)
  if (emailResult.success && !emailResult.devMode) {
    await supabase
      .from('league_invites')
      .update({
        email_sent_at: new Date().toISOString(),
        email_sent_count: (invite.email_sent_count || 0) + 1,
        last_email_error: null,
      })
      .eq('id', inviteId)
  } else {
    // Email failed or was only logged in dev mode
    await supabase
      .from('league_invites')
      .update({
        last_email_error: emailResult.error || (emailResult.devMode ? 'Email service not configured (dev mode)' : 'Failed to send email'),
      })
      .eq('id', inviteId)
  }

  revalidatePath(`/leagues/${invite.league_id}`)
  
  return { 
    data: { 
      success: emailResult.success,
      error: emailResult.error,
      devMode: emailResult.devMode,
    } 
  }
}

