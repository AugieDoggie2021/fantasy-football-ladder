/**
 * Email Sending Utility
 * 
 * Handles sending league invitation emails via Supabase Edge Functions.
 * Falls back gracefully if email service is unavailable.
 */

interface SendInviteEmailParams {
  to: string
  inviteUrl: string
  leagueName: string
  commissionerName: string
  commissionerEmail?: string
}

interface EmailResult {
  success: boolean
  error?: string
  devMode?: boolean
}

/**
 * Send a league invitation email
 * 
 * Uses Supabase Edge Function to send emails.
 * In development, emails are logged and can be viewed in Inbucket.
 */
export async function sendLeagueInviteEmail(
  params: SendInviteEmailParams
): Promise<EmailResult> {
  const { to, inviteUrl, leagueName, commissionerName, commissionerEmail } = params

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(to)) {
    return { success: false, error: 'Invalid email address' }
  }

  try {
    // Get Supabase URL and anon key from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Email service not configured' }
    }

    // Call the Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/send_invite_email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        to,
        inviteUrl,
        leagueName,
        commissionerName,
        commissionerEmail,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { 
        success: false, 
        error: data.error || 'Failed to send email' 
      }
    }

    return { 
      success: true,
      devMode: data.devMode || false,
    }
  } catch (error: any) {
    console.error('Email sending error:', error)
    return { 
      success: false, 
      error: error.message || 'Failed to send email' 
    }
  }
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

