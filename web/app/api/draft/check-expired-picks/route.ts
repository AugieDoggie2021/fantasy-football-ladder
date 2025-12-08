import { NextRequest, NextResponse } from 'next/server'
import { checkAndProcessExpiredPicks } from '@/app/actions/draft'

/**
 * API route to check for expired draft picks and process auto-picks
 * 
 * This should be called periodically (e.g., every 5-10 seconds) via:
 * - Cron job (Vercel Cron)
 * - Edge function scheduled task
 * - External cron service
 * 
 * For security, you may want to add authentication/authorization
 * or use a secret token in the request headers.
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Check for authorization token
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.DRAFT_AUTO_PICK_SECRET
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await checkAndProcessExpiredPicks()
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error: any) {
    console.error('Error in check-expired-picks route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint for manual triggering (useful for testing)
 */
export async function POST(request: NextRequest) {
  return GET(request)
}

