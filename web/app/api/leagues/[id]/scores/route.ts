import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getLeagueWeekPlayerScores } from '@/lib/league-scores'

/**
 * GET /api/leagues/[id]/scores
 * 
 * Query parameters:
 * - seasonYear: NFL season year (e.g., 2024) - required
 * - week: NFL week number (1-18) - required
 * 
 * Returns JSON array of LeagueWeekPlayerScore entries for all rostered players
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const leagueId = params.id
  const searchParams = request.nextUrl.searchParams
  const seasonYearParam = searchParams.get('seasonYear')
  const weekParam = searchParams.get('week')

  if (!seasonYearParam) {
    return NextResponse.json(
      { error: 'seasonYear query parameter is required' },
      { status: 400 }
    )
  }

  if (!weekParam) {
    return NextResponse.json(
      { error: 'week query parameter is required' },
      { status: 400 }
    )
  }

  const seasonYear = parseInt(seasonYearParam, 10)
  const week = parseInt(weekParam, 10)

  if (isNaN(seasonYear) || seasonYear < 2000 || seasonYear > 2100) {
    return NextResponse.json(
      { error: 'seasonYear must be a valid year' },
      { status: 400 }
    )
  }

  if (isNaN(week) || week < 1 || week > 18) {
    return NextResponse.json(
      { error: 'week must be between 1 and 18' },
      { status: 400 }
    )
  }

  const result = await getLeagueWeekPlayerScores({
    leagueId,
    seasonYear,
    week,
  })

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error.includes('Not authenticated') ? 401 : 500 }
    )
  }

  return NextResponse.json(result.data || [])
}

