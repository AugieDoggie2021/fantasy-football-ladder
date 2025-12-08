# Full Draft Kit Deployment Plan

## Current State

✅ **What's Working:**
- Basic draft board UI
- Commissioner can generate draft picks
- Commissioner can manually assign players
- Snake draft order generation
- Draft picks stored in database
- Roster creation on draft
- Transaction tracking

❌ **What's Missing for Production:**
- Team owner participation (currently commissioner-only)
- Realtime updates (no live sync)
- Draft timer functionality
- Auto-pick/queue system
- Draft room experience
- Mobile optimization
- Draft state management

---

## Phase 1: Enable Team Owner Participation

### 1.1 Update Database Schema
- Add `draft_status` field to `leagues` table (scheduled, in_progress, completed)
- Add `draft_started_at` and `draft_completed_at` timestamps
- Add `current_pick_id` to track active pick
- Add `draft_settings` JSONB field (timer duration, auto-pick enabled, etc.)

### 1.2 Update Access Control
- Allow team owners to access draft page (not just commissioner)
- Show different UI based on user role (commissioner vs owner)
- Owners can only pick when it's their turn

### 1.3 Team Owner Draft Actions
- Create `makeDraftPick` server action for team owners
- Validate it's the team's turn
- Validate player is available
- Update draft state

**Files to Modify:**
- `web/app/leagues/[id]/draft/page.tsx` - Remove commissioner-only restriction
- `web/app/actions/draft.ts` - Add `makeDraftPick` function
- `supabase/migrations/` - Add draft status fields

---

## Phase 2: Realtime Updates

### 2.1 Supabase Realtime Subscription
- Subscribe to `draft_picks` table changes
- Subscribe to `leagues` table for draft status changes
- Update UI automatically when picks are made

### 2.2 Implementation
- Use Supabase Realtime client in draft board component
- Show "live" indicator when draft is active
- Auto-refresh draft board on pick events
- Show notifications for new picks

**Files to Create/Modify:**
- `web/components/draft-board.tsx` - Add Realtime subscription
- `web/hooks/use-draft-realtime.ts` - Custom hook for draft updates

---

## Phase 3: Draft Timer

### 3.1 Timer System
- Configurable pick timer (default: 90 seconds)
- Countdown display for current pick
- Auto-pick if timer expires (optional)
- Pause/resume functionality (commissioner)

### 3.2 Implementation
- Server-side timer tracking (store `pick_due_at` timestamp)
- Client-side countdown display
- Auto-pick logic when timer expires
- Timer pause/resume actions

**Files to Create/Modify:**
- `web/components/draft-timer.tsx` - Timer component
- `web/app/actions/draft.ts` - Timer management functions
- `supabase/migrations/` - Add timer fields

---

## Phase 4: Draft Queue & Auto-Pick

### 4.1 Draft Queue System
- Allow users to queue players for auto-pick
- Queue priority management
- Auto-pick from queue when timer expires
- Queue management UI

### 4.2 Database Schema
- Create `draft_queues` table:
  - `team_id`, `league_id`, `player_id`, `priority`, `created_at`

### 4.3 Auto-Pick Logic
- Check queue when timer expires
- Pick highest priority available player
- Fallback to random pick if queue empty (optional)

**Files to Create:**
- `web/components/draft-queue.tsx` - Queue management UI
- `web/app/actions/draft-queue.ts` - Queue server actions
- `supabase/migrations/` - Create draft_queues table

---

## Phase 5: Enhanced Draft Room UI

### 5.1 Draft Room Layout
- Split-screen: Draft board + Player list
- Current pick highlight
- Team roster preview
- Recent picks sidebar
- Draft chat (optional, Phase 6)

### 5.2 Player Search & Filtering
- Enhanced search (name, team, position)
- Position filters
- Sort by ADP, projected points, etc.
- Player detail modal
- "My Team" roster view

### 5.3 Visual Improvements
- Better draft board visualization
- Color-coded by team
- Pick animations
- Progress indicators
- Mobile-responsive layout

**Files to Modify:**
- `web/components/draft-board.tsx` - Enhanced UI
- `web/components/draft-player-list.tsx` - New component
- `web/components/draft-room.tsx` - New container component

---

## Phase 6: Draft State Management

### 6.1 Draft Lifecycle
- **Scheduled**: Draft picks generated, waiting to start
- **In Progress**: Active draft, picks being made
- **Completed**: All picks made, rosters finalized
- **Paused**: Draft temporarily stopped (commissioner)

### 6.2 State Transitions
- Commissioner starts draft → `in_progress`
- All picks made → `completed`
- Commissioner can pause/resume
- Auto-complete when all picks done

### 6.3 Draft Completion
- Finalize all rosters
- Create transaction records
- Update league status
- Send completion notifications

**Files to Modify:**
- `web/app/actions/draft.ts` - State management functions
- `web/components/draft-board.tsx` - State-aware UI

---

## Phase 7: Mobile Optimization

### 7.1 Mobile Draft Experience
- Touch-friendly pick selection
- Swipe gestures for navigation
- Simplified mobile layout
- Push notifications for "on the clock"
- Offline draft sync (future)

### 7.2 Responsive Design
- Mobile-first draft board
- Collapsible sections
- Bottom sheet for player selection
- Optimized for small screens

**Files to Modify:**
- `web/components/draft-board.tsx` - Mobile responsive
- `web/app/leagues/[id]/draft/page.tsx` - Mobile layout

---

## Implementation Priority

### MVP (Minimum Viable Draft)
1. ✅ Phase 1: Team owner participation
2. ✅ Phase 2: Realtime updates
3. ✅ Phase 3: Basic timer (90 seconds)
4. ✅ Phase 5: Enhanced UI (basic)

### Full Production
5. ✅ Phase 4: Draft queue & auto-pick
6. ✅ Phase 6: Complete state management
7. ✅ Phase 7: Mobile optimization

### Nice to Have
- Draft chat
- Draft history/replay
- Draft analytics
- Mock drafts
- Draft room themes

---

## Database Migrations Needed

```sql
-- Add draft status to leagues
ALTER TABLE leagues 
ADD COLUMN IF NOT EXISTS draft_status TEXT DEFAULT 'scheduled' 
  CHECK (draft_status IN ('scheduled', 'in_progress', 'paused', 'completed')),
ADD COLUMN IF NOT EXISTS draft_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS draft_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_pick_id UUID REFERENCES draft_picks(id),
ADD COLUMN IF NOT EXISTS draft_settings JSONB DEFAULT '{"timer_seconds": 90, "auto_pick_enabled": false}'::jsonb;

-- Add timer to draft_picks
ALTER TABLE draft_picks
ADD COLUMN IF NOT EXISTS pick_due_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS picked_at TIMESTAMPTZ;

-- Create draft_queues table
CREATE TABLE IF NOT EXISTS draft_queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, player_id)
);

CREATE INDEX idx_draft_queues_team_league ON draft_queues(team_id, league_id);
CREATE INDEX idx_draft_queues_priority ON draft_queues(team_id, priority DESC);
```

---

## Testing Checklist

- [ ] Team owner can make picks when it's their turn
- [ ] Realtime updates work (test with multiple browsers)
- [ ] Timer counts down correctly
- [ ] Auto-pick works when timer expires
- [ ] Draft queue functions properly
- [ ] Draft state transitions work
- [ ] Mobile experience is usable
- [ ] Error handling for edge cases
- [ ] Draft completion finalizes rosters
- [ ] Performance with large player lists

---

## Deployment Steps

1. **Create database migrations** for new fields/tables
2. **Implement Phase 1** (team owner participation)
3. **Test locally** with multiple users
4. **Deploy to staging** and test thoroughly
5. **Implement Phase 2** (realtime)
6. **Test realtime** with multiple concurrent users
7. **Implement Phase 3** (timer)
8. **Implement Phase 5** (UI improvements)
9. **Deploy to production** with feature flag
10. **Monitor** and iterate based on feedback

---

## Estimated Timeline

- **Phase 1**: 2-3 days
- **Phase 2**: 1-2 days
- **Phase 3**: 2-3 days
- **Phase 4**: 2-3 days
- **Phase 5**: 3-4 days
- **Phase 6**: 1-2 days
- **Phase 7**: 2-3 days

**Total MVP**: ~1-2 weeks
**Full Production**: ~2-3 weeks

