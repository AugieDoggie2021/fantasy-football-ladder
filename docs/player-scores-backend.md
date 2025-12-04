# Player Scores Backend API

This document describes the backend API for fetching player fantasy scores for a given league, season, and week.

## Overview

The player scores backend combines:
- **Rosters**: Which players are on which teams in a league
- **Weekly Stats**: Player performance data from `player_week_stats` table
- **Scoring Rules**: Fantasy point calculations from `web/lib/scoring.ts`

This API is designed to be consumed by:
- The web app (for detailed score views and matchup displays)
- The future SwiftUI iOS app (for mobile user experience)

## Ingestion Flow

### 1. Sync External Players

**Edge Function**: `sync_external_players`

Fetches all players from SportsData.io and upserts them into the `players` table.

**Endpoint**: `POST /functions/v1/sync_external_players`

**Authentication**: Requires `X-INGESTION-KEY` header with `INGESTION_SHARED_SECRET`

**Response**:
```json
{
  "insertedCount": 528,
  "updatedCount": 0
}
```

**What it does**:
- Fetches player data from SportsData.io API
- Maps external player data to our schema
- Upserts into `players` table with `external_source = 'sportsdata'`
- Updates existing players if they already exist

### 2. Sync External Week Stats

**Edge Function**: `sync_external_week_stats`

Fetches weekly player stats from SportsData.io for a given season and week, and upserts them into `player_week_stats`.

**Endpoint**: `POST /functions/v1/sync_external_week_stats`

**Authentication**: Requires `X-INGESTION-KEY` header with `INGESTION_SHARED_SECRET`

**Request Body**:
```json
{
  "seasonYear": 2024,
  "week": 1,
  "mode": "live" // or "replay"
}
```

**Response**:
```json
{
  "seasonYear": 2024,
  "week": 1,
  "mode": "live",
  "insertedCount": 450,
  "updatedCount": 0,
  "skippedCount": 5
}
```

**What it does**:
- Fetches weekly stats from SportsData.io API
- Maps external stat data to our schema
- Links stats to players via `external_source` + `external_id`
- Stores stats with `season_year` and `nfl_week` for later association with leagues
- Note: Stats are initially stored with `league_id` and `league_week_id` as NULL
- Stats can be linked to specific league weeks later when league weeks are created

## Player Scores API

### Core Function

**File**: `web/lib/league-scores.ts`

**Function**: `getLeagueWeekPlayerScores(params)`

**Signature**:
```typescript
export async function getLeagueWeekPlayerScores(params: {
  leagueId: string
  seasonYear: number
  week: number // NFL week (1-18)
}): Promise<{ data?: LeagueWeekPlayerScore[]; error?: string }>
```

**Type Definition**:
```typescript
type LeagueWeekPlayerScore = {
  playerId: string
  playerName: string
  teamAbbrev: string | null
  position: string | null
  rosterSlot: 'starter' | 'bench'
  fantasyPoints: number
  stats: {
    passingYards?: number
    passingTds?: number
    interceptions?: number
    rushingYards?: number
    rushingTds?: number
    receivingYards?: number
    receivingTds?: number
    receptions?: number
    kickingPoints?: number
    defensePoints?: number
  }
}
```

**Implementation Details**:

1. **Authentication**: Verifies user is authenticated and has access to the league
2. **Roster Fetching**: Fetches all roster entries for the league
3. **Stats Fetching**: Fetches player week stats matching `season_year` and `nfl_week`
4. **Score Calculation**: Uses `calculatePlayerScore()` from `web/lib/scoring.ts` to compute fantasy points
5. **Edge Cases**:
   - Players with no stats (did not play) → treated as 0 fantasy points
   - Multiple stat rows (shouldn't happen due to UNIQUE constraint) → uses first occurrence

### Server Action

**File**: `web/app/actions/scores.ts`

**Function**: `getLeagueWeekPlayerScoresAction(args)`

**Usage** (Server Components):
```typescript
import { getLeagueWeekPlayerScoresAction } from '@/app/actions/scores'

const result = await getLeagueWeekPlayerScoresAction({
  leagueId: 'uuid',
  seasonYear: 2024,
  week: 1
})
```

### REST API Route

**File**: `web/app/api/leagues/[id]/scores/route.ts`

**Endpoint**: `GET /api/leagues/[id]/scores`

**Query Parameters**:
- `seasonYear` (required): NFL season year (e.g., 2024)
- `week` (required): NFL week number (1-18)

**Example Request**:
```
GET /api/leagues/abc123/scores?seasonYear=2024&week=1
```

**Response** (200 OK):
```json
[
  {
    "playerId": "player-uuid",
    "playerName": "Patrick Mahomes",
    "teamAbbrev": "KC",
    "position": "QB",
    "rosterSlot": "starter",
    "fantasyPoints": 24.0,
    "stats": {
      "passingYards": 300,
      "passingTds": 3,
      "interceptions": 1,
      "rushingYards": 20
    }
  },
  {
    "playerId": "player-uuid-2",
    "playerName": "Josh Allen",
    "teamAbbrev": "BUF",
    "position": "QB",
    "rosterSlot": "bench",
    "fantasyPoints": 0,
    "stats": {}
  }
]
```

**Error Responses**:
- `400 Bad Request`: Missing or invalid query parameters
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Database or processing error

## Scoring Rules

The scoring rules are defined in `web/lib/scoring.ts`:

- **Passing**: 1 pt per 25 yards, 4 pts per TD, -2 per INT
- **Rushing**: 1 pt per 10 yards, 6 pts per TD
- **Receiving**: 1 pt per 10 yards, 6 pts per TD, 1 pt per reception (PPR)
- **Kicking**: Uses `kicking_points` as aggregated points
- **Defense**: Uses `defense_points` as aggregated points

Scores are rounded to 2 decimal places.

## Usage Examples

### Web App (Server Component)

```typescript
import { getLeagueWeekPlayerScoresAction } from '@/app/actions/scores'

export default async function LeagueScoresPage({ params }: { params: { id: string } }) {
  const scores = await getLeagueWeekPlayerScoresAction({
    leagueId: params.id,
    seasonYear: 2024,
    week: 1
  })

  if (scores.error) {
    return <div>Error: {scores.error}</div>
  }

  return (
    <div>
      {scores.data?.map(score => (
        <div key={score.playerId}>
          {score.playerName}: {score.fantasyPoints} pts
        </div>
      ))}
    </div>
  )
}
```

### Web App (Client Component)

```typescript
'use client'

import { useState } from 'react'

export function ScoresViewer({ leagueId }: { leagueId: string }) {
  const [scores, setScores] = useState([])

  const fetchScores = async () => {
    const response = await fetch(
      `/api/leagues/${leagueId}/scores?seasonYear=2024&week=1`
    )
    const data = await response.json()
    setScores(data)
  }

  // ...
}
```

### iOS SwiftUI App (Future)

```swift
struct ScoresView: View {
    let leagueId: String
    
    @State private var scores: [LeagueWeekPlayerScore] = []
    
    var body: some View {
        List(scores) { score in
            HStack {
                Text(score.playerName)
                Spacer()
                Text("\(score.fantasyPoints, specifier: "%.2f") pts")
            }
        }
        .onAppear {
            fetchScores()
        }
    }
    
    func fetchScores() {
        let url = URL(string: "\(supabaseUrl)/rest/v1/rpc/get_league_week_scores?league_id=\(leagueId)&season_year=2024&week=1")!
        // ... make request
    }
}
```

## Testing

Tests are located in `web/lib/__tests__/league-scores.test.ts`.

**Test Coverage**:
- Returns player scores for a league week
- Handles empty roster
- Returns error when not authenticated
- Returns error when league not found
- Correctly computes fantasy points
- Handles players with no stats (0 points)

Run tests:
```bash
cd web
npm test
```

## Dev-Only View

A dev-only component is available at the dashboard for manual verification:

**Component**: `web/components/dev-player-scores-view.tsx`

**Location**: Dashboard page (only visible when `NEXT_PUBLIC_APP_ENV === 'dev'`)

**Features**:
- Select league from dropdown
- Set season year and week
- Fetch and display player scores in a table
- Shows API endpoint being called
- Displays raw stats and computed fantasy points

## Database Schema

### Key Tables

**`players`**:
- `id` (UUID)
- `external_source` (TEXT) - e.g., 'sportsdata'
- `external_id` (TEXT) - External provider's player ID
- `full_name` (TEXT)
- `position` (TEXT) - QB, RB, WR, TE, K, DEF
- `nfl_team` (TEXT) - Team abbreviation

**`rosters`**:
- `player_id` (UUID) → `players.id`
- `team_id` (UUID) → `teams.id`
- `league_id` (UUID) → `leagues.id`
- `is_starter` (BOOLEAN)
- `slot_type` (TEXT) - QB, RB, WR, TE, FLEX, K, DEF, BENCH

**`player_week_stats`**:
- `player_id` (UUID) → `players.id`
- `league_id` (UUID, nullable) → `leagues.id`
- `league_week_id` (UUID, nullable) → `league_weeks.id`
- `season_year` (INTEGER) - NFL season year
- `nfl_week` (INTEGER) - NFL week (1-18)
- `passing_yards`, `passing_tds`, `interceptions`, etc.
- `external_source` (TEXT)
- `external_stat_key` (TEXT)

**Note**: Stats are stored with `season_year` and `nfl_week` to allow syncing before league weeks are created. They can be linked to `league_week_id` later.

## Future Enhancements

- [ ] Support for custom scoring rules per league
- [ ] Caching of computed scores
- [ ] Batch fetching for multiple weeks
- [ ] Real-time score updates during games
- [ ] Historical score queries
- [ ] Score projections/forecasts

