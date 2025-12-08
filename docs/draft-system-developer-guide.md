# Draft System - Developer Guide

## Overview

This guide provides technical documentation for developers working on the draft system. It covers architecture, components, server actions, database schema, and integration points.

## Table of Contents

1. [Architecture](#architecture)
2. [Database Schema](#database-schema)
3. [Server Actions](#server-actions)
4. [Client Components](#client-components)
5. [Realtime Updates](#realtime-updates)
6. [Analytics & Monitoring](#analytics--monitoring)
7. [Error Handling](#error-handling)
8. [Performance Optimizations](#performance-optimizations)
9. [Testing](#testing)

## Architecture

### High-Level Overview

```
┌─────────────────┐
│   Draft Page    │
│  (Server RSC)   │
└────────┬────────┘
         │
         ├──► DraftBoard (Client Component)
         │    ├──► DraftStatusPanel
         │    ├──► DraftTimer
         │    ├──► DraftQueue
         │    ├──► DraftPlayerList
         │    └──► DraftMobileActions
         │
         └──► DraftControls (Commissioner Only)
              └──► Server Actions
                   ├──► startDraft
                   ├──► pauseDraft
                   ├──► resumeDraft
                   ├──► makeDraftPick
                   └──► extendTimer
```

### Data Flow

1. **Initial Load**: Server fetches draft state, picks, teams, players
2. **Realtime Updates**: WebSocket connection to Supabase Realtime
3. **User Actions**: Client calls server actions
4. **State Updates**: Realtime subscription updates UI
5. **Optimistic Updates**: UI updates immediately, reverts on error

## Database Schema

### Tables

#### `leagues`
```sql
- draft_status: TEXT (not_started, in_progress, paused, completed)
- draft_started_at: TIMESTAMPTZ
- draft_completed_at: TIMESTAMPTZ
- current_pick_id: UUID (FK to draft_picks)
- draft_settings: JSONB {
    timer_seconds: number (default: 90)
    auto_pick_enabled: boolean (default: true)
    rounds: number (default: 14)
  }
```

#### `draft_picks`
```sql
- id: UUID (PK)
- league_id: UUID (FK)
- team_id: UUID (FK)
- round: INTEGER
- overall_pick: INTEGER
- player_id: UUID (FK, nullable)
- pick_due_at: TIMESTAMPTZ (nullable)
- picked_at: TIMESTAMPTZ (nullable)
```

#### `draft_queues`
```sql
- id: UUID (PK)
- team_id: UUID (FK)
- league_id: UUID (FK)
- player_id: UUID (FK)
- priority: INTEGER (higher = higher priority)
- created_at: TIMESTAMPTZ
- UNIQUE(team_id, player_id)
```

#### `draft_audit_log`
```sql
- id: UUID (PK)
- league_id: UUID (FK)
- user_id: UUID (FK)
- action_type: TEXT (pick_made, pick_failed, etc.)
- draft_pick_id: UUID (nullable)
- player_id: UUID (nullable)
- team_id: UUID (nullable)
- metadata: JSONB
- ip_address: INET
- user_agent: TEXT
- created_at: TIMESTAMPTZ
```

### Indexes

- `idx_leagues_current_pick_id` on `leagues(current_pick_id)`
- `idx_draft_picks_pick_due_at` on `draft_picks(pick_due_at)`
- `idx_draft_queues_team_league` on `draft_queues(team_id, league_id)`
- `idx_draft_queues_priority` on `draft_queues(team_id, priority DESC)`

### Row Level Security (RLS)

**Leagues**
- Select: Users can view leagues they created or have teams in
- Update: Only league creators can update draft status

**Draft Picks**
- Select: All league members can view
- Update: League creators OR current pick team owners (when it's their turn)

**Draft Queues**
- Select: Team owners and league creators
- Insert/Update/Delete: Only team owners

## Server Actions

### Location
`web/app/actions/draft.ts`

### Key Functions

#### `generateDraftPicksForLeague(leagueId, rounds)`
- Generates snake draft order
- Creates draft_picks records for all rounds
- Validates teams exist
- Returns error if picks already exist

#### `startDraft(leagueId)`
- Sets `draft_status` to 'in_progress'
- Sets `draft_started_at` timestamp
- Sets `current_pick_id` to first pick
- Starts timer for first pick
- Tracks analytics event

#### `pauseDraft(leagueId)`
- Sets `draft_status` to 'paused'
- Clears `pick_due_at` for current pick
- Only commissioner can pause

#### `resumeDraft(leagueId)`
- Sets `draft_status` to 'in_progress'
- Restarts timer for current pick
- Only commissioner can resume

#### `makeDraftPick(formData)`
- Validates user authentication
- Validates input (validation.ts)
- Checks rate limits (rate-limit.ts)
- Verifies it's user's turn (or commissioner)
- Updates draft_pick with player_id
- Creates roster entry
- Creates transaction record
- Advances to next pick
- Handles draft completion
- Logs audit trail
- Tracks analytics

**Error Handling:**
- Concurrent pick protection (optimistic locking)
- Network error retries
- Validation errors
- Rate limit errors

#### `processAutoPick(draftPickId, leagueId)`
- Called when timer expires
- Checks team's draft queue
- Picks highest priority available player
- Falls back to random if queue empty and auto-pick enabled
- Skips pick if auto-pick disabled
- Uses `makeDraftPickSystem` helper

#### `addPlayerToQueue(leagueId, teamId, playerId, priority?)`
- Validates team ownership
- Checks for duplicate
- Sets priority (auto-increment if not provided)
- Tracks analytics

#### `removePlayerFromQueue(leagueId, teamId, playerId)`
- Validates team ownership
- Removes from queue
- Tracks analytics

#### `reorderQueue(leagueId, teamId, queueItemIds)`
- Validates team ownership
- Updates priorities based on array order
- Tracks analytics

#### `extendTimer(leagueId, additionalSeconds)`
- Validates commissioner
- Extends `pick_due_at` by additional seconds
- Tracks analytics with time remaining

### Helper Functions

#### `getNextDraftPick(leagueId)`
- Finds next unpicked draft pick
- Returns null if draft complete

#### `calculatePickDueAt(timerSeconds)`
- Calculates `pick_due_at` timestamp
- Adds timer seconds to current time

#### `finalizeDraft(leagueId, userId)`
- Validates all picks are made
- Ensures rosters are complete
- Creates missing roster entries
- Sets `draft_status` to 'completed'

## Client Components

### DraftBoard
**Location**: `web/components/draft-board.tsx`

**Props:**
- `leagueId`: string
- `teams`: Team[]
- `draftPicks`: DraftPick[]
- `availablePlayers`: Player[]
- `draftStatus`: string
- `currentPickId`: string | null
- `userTeamId`: string | null
- `isCommissioner`: boolean

**Features:**
- Real-time updates via `useDraftRealtime`
- Optimistic UI updates
- Pick animations
- Mobile-responsive layout
- Split-screen with queue (desktop)
- Mobile bottom sheets

**State Management:**
- Uses realtime hook for live data
- Memoizes expensive calculations
- Optimistic updates for picks

### DraftTimer
**Location**: `web/components/draft-timer.tsx`

**Props:**
- `pickDueAt`: string | null
- `isPaused`: boolean
- `onExpired`: () => void
- `size`: 'sm' | 'md' | 'lg'

**Features:**
- Client-side countdown (updates every second)
- Visual states (normal, warning, critical, expired)
- Handles clock drift
- Pause support

### DraftQueue
**Location**: `web/components/draft-queue.tsx`

**Props:**
- `leagueId`: string
- `teamId`: string
- `availablePlayers`: Player[]
- `draftedPlayerIds`: Set<string>
- `isEditable`: boolean

**Features:**
- Drag-and-drop reordering (desktop)
- Add/remove players
- Priority management
- Visual indicators for drafted players
- Real-time updates

### DraftPlayerList
**Location**: `web/components/draft-player-list.tsx`

**Props:**
- `players`: Player[]
- `leagueId`: string
- `teamId`: string | null
- `onSelectPlayer`: (playerId: string) => void
- `draftedPlayerIds`: Set<string>

**Features:**
- Debounced search (300ms)
- Position filtering
- Multiple sort options
- Lazy loading (50 items at a time)
- Quick-add to queue

### DraftStatusPanel
**Location**: `web/components/draft-status-panel.tsx`

**Props:**
- `draftPicks`: DraftPick[]
- `teams`: Team[]
- `currentPickId`: string | null
- `draftStatus`: string
- `nextPick`: DraftPick | null
- `isUserTurn`: boolean
- `userTeamId`: string | null

**Features:**
- Current pick display
- Overall progress bar
- Round progress
- Team pick counts
- Upcoming picks preview

### DraftMobileActions
**Location**: `web/components/draft-mobile-actions.tsx`

**Features:**
- Floating action buttons (FABs)
- Quick pick functionality
- Queue access
- Player list access
- Only visible on mobile (< lg breakpoint)

## Realtime Updates

### Hook: `useDraftRealtime`
**Location**: `web/lib/hooks/use-draft-realtime.ts`

**Features:**
- Subscribes to `draft_picks` table changes
- Subscribes to `leagues` table changes
- Filters by `league_id`
- Provides connection status
- Callbacks for pick updates and status changes

**Usage:**
```typescript
const {
  picks,
  draftState,
  isConnected,
  error,
} = useDraftRealtime({
  leagueId,
  enabled: draftStatus === 'in_progress',
  onPickUpdate: (pick) => { /* handle update */ },
  onDraftStatusChange: (state) => { /* handle status change */ },
})
```

### Supabase Realtime Configuration

**Migration**: `20250108000004_enable_realtime_for_draft_tables.sql`

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.draft_picks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leagues;
```

## Analytics & Monitoring

### Event Types
**Location**: `web/lib/analytics/events.ts`

**Draft Events:**
- `DRAFT_STARTED`
- `DRAFT_PAUSED`
- `DRAFT_RESUMED`
- `DRAFT_PICK_MADE`
- `DRAFT_PICK_FAILED`
- `DRAFT_COMPLETED`
- `DRAFT_TIMER_EXTENDED`
- `DRAFT_QUEUE_ADDED`
- `DRAFT_QUEUE_REMOVED`
- `DRAFT_QUEUE_REORDERED`
- `DRAFT_AUTO_PICK_TRIGGERED`

### Tracking Functions
**Location**: `web/lib/analytics/server-track.ts`

All tracking is non-blocking (uses `.catch()`).

### Error Monitoring
**Location**: `web/lib/error-monitoring.ts`

- `trackClientError()`: Client-side errors
- `trackServerError()`: Server-side errors
- `withErrorTracking()`: Wrapper for async functions

### Error Boundary
**Location**: `web/components/error-boundary.tsx`

- Catches React component errors
- Tracks errors with context
- Shows user-friendly fallback UI
- Integrated in root layout

## Error Handling

### Validation
**Location**: `web/lib/draft-validation.ts`

- Input validation using Zod schemas
- Validates draft pick inputs
- Validates draft status transitions
- Validates timer extensions
- Validates draft settings

### Rate Limiting
**Location**: `web/lib/draft-rate-limit.ts`

- In-memory rate limiting (server actions)
- Limits: 10 picks per minute per user
- Returns remaining count and reset time
- Prevents abuse

### Concurrent Pick Protection

**Optimistic Locking:**
```typescript
.update({ player_id: playerId })
.eq('id', draftPickId)
.is('player_id', null) // Only update if still null
```

**Race Condition Checks:**
- Verifies `current_pick_id` hasn't changed
- Double-checks pick state before update
- Returns clear error messages

### Network Error Handling

**Retry Logic:**
- Exponential backoff
- Max 2 retries
- Only for network errors
- User-friendly error messages

## Performance Optimizations

### Memoization
- `draftedPlayerIds`: Memoized Set calculation
- `availablePlayers`: Memoized filtering
- `picksByRound`: Memoized grouping
- `maxRound`: Memoized calculation
- `nextPick`: Memoized find operation
- `isUserTurn`: Memoized boolean

### Lazy Loading
- Player list: 50 items initially, loads more on scroll
- Draft rounds: Only renders visible rounds
- Resets when filters change

### Debouncing
- Search input: 300ms delay
- Custom hook: `useDebounce`

### Virtual Scrolling
- Hook available: `useVirtualScroll`
- Ready for integration if needed
- Supports overscan for smooth scrolling

### Code Splitting
- Components loaded on demand
- Server actions tree-shaken
- Analytics loaded separately

## Testing

### Manual Testing Checklist

**Commissioner Actions:**
- [ ] Generate draft picks
- [ ] Start draft
- [ ] Pause draft
- [ ] Resume draft
- [ ] Extend timer
- [ ] Complete draft manually

**Team Owner Actions:**
- [ ] Make pick when it's my turn
- [ ] Add player to queue
- [ ] Remove player from queue
- [ ] Reorder queue
- [ ] View draft board
- [ ] Search players
- [ ] Filter by position
- [ ] Sort players

**Edge Cases:**
- [ ] Concurrent picks (two users try to pick simultaneously)
- [ ] Timer expiration
- [ ] Auto-pick from queue
- [ ] Auto-pick random (queue empty)
- [ ] Network disconnection
- [ ] Page refresh during draft
- [ ] Mobile experience
- [ ] Large player lists (performance)

### Integration Testing

**API Routes:**
- `/api/draft/check-expired-picks`: Test auto-pick processing

**Server Actions:**
- Test all validation paths
- Test rate limiting
- Test concurrent pick protection
- Test error handling

### Performance Testing

**Metrics to Monitor:**
- Time to first render
- Realtime update latency
- Search/filter performance
- Large list scrolling
- Memory usage

## Deployment Considerations

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_POSTHOG_KEY` (analytics)
- `NEXT_PUBLIC_POSTHOG_HOST` (analytics)

### Database Migrations
All migrations must be applied in order:
1. `20250108000000_add_draft_status_fields.sql`
2. `20250108000001_add_draft_pick_timer_fields.sql`
3. `20250108000002_create_draft_queues_table.sql`
4. `20250108000003_update_draft_picks_rls_for_team_owners.sql`
5. `20250108000004_enable_realtime_for_draft_tables.sql`
6. `20250108000005_create_draft_audit_log.sql`

### Monitoring

**PostHog:**
- Track all draft events
- Monitor error rates
- User behavior analytics

**Supabase:**
- Database logs
- Realtime connection status
- Query performance

**Error Tracking:**
- Client errors via PostHog
- Server errors via Supabase analytics_events
- Error boundary catches React errors

## Future Enhancements

### Potential Features
- Draft chat/commentary
- Trade picks during draft
- Draft history/replay
- Draft predictions/analysis
- Multi-draft support (multiple drafts simultaneously)
- Draft templates/presets
- Advanced queue strategies (position-based priorities)

### Performance Improvements
- Implement virtual scrolling for very large player lists
- WebSocket connection pooling
- Optimistic updates for queue operations
- Cache player data

### UX Improvements
- Keyboard shortcuts
- Draft sound effects/notifications
- Better mobile gestures
- Draft timer notifications (browser notifications)

## Contributing

When adding new features:
1. Update this documentation
2. Add analytics tracking
3. Add error handling
4. Update RLS policies if needed
5. Add audit logging
6. Test on mobile
7. Update user guide if needed

