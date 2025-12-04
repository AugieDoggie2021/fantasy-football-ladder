# Player Scores Backend API

This document describes the backend API for fetching player fantasy scores for a given league, season, and week.

**Last Updated**: Phase 11 - Scoring rules UI, bonus points support, and performance optimizations added.

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

## League Week Mapping

**File**: `web/lib/week-mapping.ts`

The scoring system now uses **league weeks** as first-class citizens. The `resolveLeagueWeek()` helper maps between:
- League-specific week numbers (`league_weeks.week_number`)
- NFL season years and weeks (`season_year`, `nfl_week`)

**Key Functions**:
- `resolveLeagueWeek(leagueId, seasonYear?, week?)` - Resolves or creates a league week
- `getCurrentLeagueWeek(leagueId)` - Gets the current week for a league

**Note**: For now, league week numbers map 1:1 to NFL weeks. This can be extended in the future for bye weeks, playoffs, etc.

## Custom Scoring Rules

**File**: `web/lib/scoring-config.ts`

Leagues can now have custom scoring rules stored in `leagues.scoring_settings` (JSONB).

**Default Configuration** (Yahoo-style standard):
```json
{
  "passingYardsPerPoint": 25,
  "passingTdPoints": 4,
  "interceptionPoints": -2,
  "rushingYardsPerPoint": 10,
  "rushingTdPoints": 6,
  "receivingYardsPerPoint": 10,
  "receivingTdPoints": 6,
  "receptionPoints": 1,
  "rushingYardageBonus": {
    "enabled": false,
    "threshold": 100,
    "bonusPoints": 3
  },
  "receivingYardageBonus": {
    "enabled": false,
    "threshold": 100,
    "bonusPoints": 3
  },
  "passingYardageBonus": {
    "enabled": false,
    "threshold": 300,
    "bonusPoints": 3
  }
}
```

**Customization Examples**:
- Half-PPR: `"receptionPoints": 0.5`
- Standard (non-PPR): `"receptionPoints": 0`
- Custom passing: `"passingYardsPerPoint": 20` (more points per yard)
- Enable rushing bonus: `"rushingYardageBonus": { "enabled": true, "threshold": 100, "bonusPoints": 3 }`

**Bonus Points**:
- **Rushing Yardage Bonus**: Award bonus points when a player reaches a threshold (e.g., 100+ yards = +3 points)
- **Receiving Yardage Bonus**: Award bonus points when a player reaches a threshold (e.g., 100+ yards = +3 points)
- **Passing Yardage Bonus**: Award bonus points when a QB reaches a threshold (e.g., 300+ yards = +3 points)

Bonuses are configurable per league and can be enabled/disabled independently. When enabled, bonuses are applied automatically during score calculation.

The scoring functions automatically use the league's custom config when calculating fantasy points.

## Fantasy Points Caching

**Migrations**: 
- `20241202000006_add_fantasy_points_caching.sql` - Adds `fantasy_points` column
- `20241202000007_batch_update_fantasy_points.sql` - Adds batch update stored procedure

The `player_week_stats` table now includes a `fantasy_points` column that caches computed scores.

**How it works**:
1. When commissioner applies scoring for a week, fantasy points are computed and stored in `fantasy_points`
2. Subsequent API calls read from cache when available
3. If `fantasy_points` is NULL, scores are computed on-the-fly using current scoring rules

**Performance Optimization**:
- **Batch Updates**: Uses stored procedure `batch_update_fantasy_points()` to update all player scores in a single database operation
- **Stored Procedure**: `public.batch_update_fantasy_points(updates JSONB)` accepts an array of `{id, fantasy_points}` objects and updates all rows efficiently
- **Fallback**: If batch update fails, falls back to individual updates (for resilience)

**Benefits**:
- Faster API responses
- Consistent scores (won't change if scoring rules are updated later)
- Historical accuracy (scores reflect rules at time of calculation)
- Optimized database writes (batch updates instead of N individual queries)

## Commissioner Workflow

**Files**: 
- `web/app/actions/commissioner-workflow.ts` - Workflow orchestration
- `web/app/actions/scoring-config.ts` - Scoring settings management

A streamlined workflow for commissioners:

### Score Calculation Workflow

**UI Component**: `web/components/commissioner-scoring-workflow.tsx`

1. **Ingest External Stats** - Fetches player stats from SportsData.io for the current week
2. **Preview Scores (Dry Run)** - Calculates scores without applying them
3. **Apply Scores** - Finalizes scores, updates matchups, and caches fantasy points (using batch updates)

### Scoring Rules Management

**UI Component**: `web/components/league-scoring-settings-form.tsx`

Commissioners can view and edit league scoring rules directly from the league detail page:

- **Presets**: Quick selection of Standard (Non-PPR), Half PPR, or Full PPR
- **Custom Settings**: Fine-tune yardage per point, TD values, interception penalties
- **Bonus Configuration**: Enable/disable and configure yardage bonuses for rushing, receiving, and passing
- **Validation**: Real-time validation ensures all values are within acceptable ranges
- **Persistence**: Changes are saved immediately and affect all future score calculations

**Server Action**: `updateLeagueScoringConfig(leagueId, config)`
- Validates config using `validateScoringConfig()`
- Ensures only league commissioner can update settings
- Updates `leagues.scoring_settings` JSONB column

Available on the league detail page for league commissioners only.

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
2. **League Week Resolution**: Uses `resolveLeagueWeek()` to get `league_week_id` and season info
3. **Scoring Config**: Fetches league's `scoring_settings` and parses custom scoring rules
4. **Roster Fetching**: Fetches all roster entries for the league
5. **Stats Fetching**: 
   - **Preferred**: Fetches stats by `league_week_id` (normalized path)
   - **Fallback**: Fetches by `season_year` + `nfl_week` if `league_week_id` not available
6. **Score Calculation**: 
   - **Cached**: Uses `fantasy_points` from database if available
   - **Computed**: Uses `calculatePlayerScoreWithConfig()` with league's scoring config
7. **Edge Cases**:
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

### REST API Routes

#### Player Scores Endpoint

**File**: `web/app/api/leagues/[id]/scores/route.ts`

**Endpoint**: `GET /api/leagues/[id]/scores`

**Query Parameters**:
- `seasonYear` (required): NFL season year (e.g., 2024)
- `week` (required): NFL week number (1-18)

**Example Request**:
```
GET /api/leagues/abc123/scores?seasonYear=2024&week=1
```

#### Team Totals Endpoint

**File**: `web/app/api/leagues/[id]/scores/summary/route.ts`

**Endpoint**: `GET /api/leagues/[id]/scores/summary`

**Query Parameters**:
- `seasonYear` (required): NFL season year (e.g., 2024)
- `week` (required): NFL week number (1-18)

**Example Request**:
```
GET /api/leagues/abc123/scores/summary?seasonYear=2024&week=1
```

**Response** (200 OK):
```json
[
  {
    "teamId": "team-uuid-1",
    "teamName": "Team Alpha",
    "totalFantasyPoints": 125.5,
    "matchupId": "matchup-uuid-1"
  },
  {
    "teamId": "team-uuid-2",
    "teamName": "Team Beta",
    "totalFantasyPoints": 118.25,
    "matchupId": "matchup-uuid-1"
  }
]
```

**Note**: Teams are sorted by total fantasy points (descending). Only starter points are included.

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

The scoring rules are defined in `web/lib/scoring.ts` and `web/lib/scoring-config.ts`.

**Default Rules** (Yahoo-style standard):
- **Passing**: 1 pt per 25 yards, 4 pts per TD, -2 per INT
- **Rushing**: 1 pt per 10 yards, 6 pts per TD
- **Receiving**: 1 pt per 10 yards, 6 pts per TD, 1 pt per reception (PPR)
- **Kicking**: Uses `kicking_points` as aggregated points
- **Defense**: Uses `defense_points` as aggregated points
- **Bonuses**: Disabled by default (can be enabled per league)

**Bonus Rules** (when enabled):
- **Rushing**: +3 points for 100+ rushing yards
- **Receiving**: +3 points for 100+ receiving yards
- **Passing**: +3 points for 300+ passing yards

**Custom Scoring**: Each league can override these defaults via `scoring_settings` JSONB column. Commissioners can edit scoring rules via the UI on the league detail page.

**Validation**: All scoring configs are validated before saving:
- Yardage per point must be > 0
- TD points must be >= 0
- Bonus thresholds must be > 0 when enabled
- Bonus points must be >= 0 when enabled

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

**Example: Fetching Player Scores**

```swift
struct ScoresView: View {
    let leagueId: String
    let seasonYear: Int
    let week: Int
    
    @State private var scores: [LeagueWeekPlayerScore] = []
    @State private var loading = false
    @State private var error: String?
    
    var body: some View {
        List(scores) { score in
            HStack {
                VStack(alignment: .leading) {
                    Text(score.playerName)
                        .font(.headline)
                    Text("\(score.position ?? "N/A") • \(score.teamAbbrev ?? "N/A")")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
                VStack(alignment: .trailing) {
                    Text("\(score.fantasyPoints, specifier: "%.2f")")
                        .font(.title3)
                        .fontWeight(.semibold)
                    Text(score.rosterSlot == "starter" ? "Starter" : "Bench")
                        .font(.caption)
                        .foregroundColor(score.rosterSlot == "starter" ? .green : .gray)
                }
            }
        }
        .onAppear {
            fetchScores()
        }
    }
    
    func fetchScores() {
        loading = true
        error = nil
        
        let url = URL(string: "\(supabaseUrl)/functions/v1/api/leagues/\(leagueId)/scores?seasonYear=\(seasonYear)&week=\(week)")!
        
        var request = URLRequest(url: url)
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTask(with: request) { data, response, err in
            // Handle response
            if let data = data {
                if let decoded = try? JSONDecoder().decode([LeagueWeekPlayerScore].self, from: data) {
                    DispatchQueue.main.async {
                        self.scores = decoded
                        self.loading = false
                    }
                }
            }
        }.resume()
    }
}
```

**Example: Fetching Team Totals**

```swift
struct TeamScoresView: View {
    let leagueId: String
    let seasonYear: Int
    let week: Int
    
    @State private var summaries: [LeagueWeekTeamScoreSummary] = []
    
    var body: some View {
        List(summaries) { summary in
            HStack {
                Text(summary.teamName)
                Spacer()
                Text("\(summary.totalFantasyPoints, specifier: "%.2f") pts")
                    .fontWeight(.semibold)
            }
        }
        .onAppear {
            fetchTeamTotals()
        }
    }
    
    func fetchTeamTotals() {
        let url = URL(string: "\(supabaseUrl)/functions/v1/api/leagues/\(leagueId)/scores/summary?seasonYear=\(seasonYear)&week=\(week)")!
        // ... make request similar to above
    }
}
```

**Type Definitions for Swift**:

```swift
struct LeagueWeekPlayerScore: Codable, Identifiable {
    let playerId: String
    let playerName: String
    let teamAbbrev: String?
    let position: String?
    let rosterSlot: String // "starter" or "bench"
    let fantasyPoints: Double
    let stats: PlayerStats
    
    var id: String { playerId }
}

struct PlayerStats: Codable {
    let passingYards: Double?
    let passingTds: Int?
    let interceptions: Int?
    let rushingYards: Double?
    let rushingTds: Int?
    let receivingYards: Double?
    let receivingTds: Int?
    let receptions: Int?
    let kickingPoints: Int?
    let defensePoints: Int?
}

struct LeagueWeekTeamScoreSummary: Codable, Identifiable {
    let teamId: String
    let teamName: String
    let totalFantasyPoints: Double
    let matchupId: String?
    
    var id: String { teamId }
}
```

**Note for iOS Integration**: 
- iOS clients do not need to know about scoring math or bonus calculations
- The `fantasyPoints` field in API responses already includes all bonuses and custom scoring rules
- Simply display the `fantasyPoints` value as-is
- Scoring rules are managed by commissioners via the web UI

## Testing

Tests are located in `web/lib/__tests__/league-scores.test.ts`.

**Test Coverage**:
- Returns player scores for a league week
- Handles empty roster
- Returns error when not authenticated
- Returns error when league not found
- Correctly computes fantasy points
- Handles players with no stats (0 points)
- **Bonus Scoring**: Tests for rushing, receiving, and passing yardage bonuses
- **Config Validation**: Tests for parsing and validating scoring configs
- **Config Presets**: Tests for standard, half-PPR, and full-PPR presets

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

## Phase 10 & 11 Updates

**Phase 10 Completed**:
- ✅ League weeks are first-class citizens in scoring pipeline
- ✅ Custom scoring rules per league (stored in `leagues.scoring_settings`)
- ✅ Fantasy points caching (`player_week_stats.fantasy_points`)
- ✅ Commissioner workflow UI (ingest → preview → apply)
- ✅ Team totals endpoint (`/api/leagues/[id]/scores/summary`)

**Phase 11 Completed**:
- ✅ Commissioner scoring rules UI with presets and validation
- ✅ Bonus points support (rushing, receiving, passing yardage bonuses)
- ✅ Performance optimization (batch updates via stored procedure)
- ✅ Comprehensive tests for bonus scoring and config validation

**Key Files**:
- `web/lib/week-mapping.ts` - League week resolution
- `web/lib/scoring-config.ts` - Custom scoring configuration with bonus support
- `web/lib/scoring.ts` - Scoring calculation with bonus logic
- `web/app/actions/commissioner-workflow.ts` - Commissioner workflow orchestration
- `web/app/actions/scoring-config.ts` - Scoring settings management
- `web/components/commissioner-scoring-workflow.tsx` - Score calculation UI
- `web/components/league-scoring-settings-form.tsx` - Scoring rules editor UI
- `supabase/migrations/20241202000006_add_fantasy_points_caching.sql` - Caching migration
- `supabase/migrations/20241202000007_batch_update_fantasy_points.sql` - Batch update optimization

## Future Enhancements

- [ ] Batch fetching for multiple weeks
- [ ] Real-time score updates during games
- [ ] Historical score queries
- [ ] Score projections/forecasts
- [ ] Additional bonus types (e.g., multi-TD bonuses, milestone bonuses)

