# Draft Kit - Complete To-Do List

## Stage 0: Current State ✅
- [x] Basic draft board UI (commissioner-only)
- [x] Manual player assignment by commissioner
- [x] Snake draft order generation
- [x] Draft picks database schema
- [x] Roster creation on draft
- [x] Transaction tracking

---

## Stage 1: Database Foundation

### 1.1 League Draft Status Fields
- [ ] Create migration: Add `draft_status` to `leagues` table
  - Values: `scheduled`, `in_progress`, `paused`, `completed`
  - Default: `scheduled`
- [ ] Add `draft_started_at` timestamp field
- [ ] Add `draft_completed_at` timestamp field
- [ ] Add `current_pick_id` UUID field (references draft_picks)
- [ ] Add `draft_settings` JSONB field
  - `timer_seconds` (default: 90)
  - `auto_pick_enabled` (default: false)
  - `rounds` (default: 14)

### 1.2 Draft Picks Timer Fields
- [ ] Create migration: Add `pick_due_at` timestamp to `draft_picks`
- [ ] Add `picked_at` timestamp to `draft_picks`
- [ ] Add index on `pick_due_at` for timer queries

### 1.3 Draft Queue Table
- [ ] Create migration: Create `draft_queues` table
  - `id` UUID primary key
  - `team_id` UUID (references teams)
  - `league_id` UUID (references leagues)
  - `player_id` UUID (references players)
  - `priority` INTEGER (default: 0, higher = more priority)
  - `created_at` TIMESTAMPTZ
  - Unique constraint: (team_id, player_id)
- [ ] Add indexes:
  - `idx_draft_queues_team_league` on (team_id, league_id)
  - `idx_draft_queues_priority` on (team_id, priority DESC)

### 1.4 RLS Policies for Draft Queue
- [ ] Policy: Users can view their own team's queue
- [ ] Policy: Users can manage their own team's queue (insert/update/delete)
- [ ] Policy: League creators can view all queues

---

## Stage 2: Backend - Draft State Management

### 2.1 Draft Status Actions
- [ ] Create `startDraft` server action
  - Validate commissioner
  - Set draft_status to `in_progress`
  - Set draft_started_at
  - Set current_pick_id to first pick
  - Set pick_due_at for first pick
  - Track analytics event
- [ ] Create `pauseDraft` server action
  - Validate commissioner
  - Set draft_status to `paused`
  - Clear pick_due_at timers
- [ ] Create `resumeDraft` server action
  - Validate commissioner
  - Set draft_status to `in_progress`
  - Recalculate pick_due_at for current pick
- [ ] Create `completeDraft` server action
  - Validate commissioner
  - Set draft_status to `completed`
  - Set draft_completed_at
  - Finalize all rosters
  - Track analytics event

### 2.2 Draft Pick Actions (Team Owners)
- [ ] Update `assignPlayerToDraftPick` → Rename to `makeDraftPick`
  - Remove commissioner-only restriction
  - Add validation: Check if it's the team's turn
  - Add validation: Check if draft is in_progress
  - Add validation: Check if player is available
  - Set `picked_at` timestamp
  - Update `current_pick_id` to next pick
  - Set `pick_due_at` for next pick
  - Auto-advance if timer expired
  - Track analytics event
- [ ] Create `getCurrentDraftState` helper function
  - Returns current pick, next pick, draft status
  - Returns timer info if active

### 2.3 Auto-Pick Logic
- [ ] Create `processAutoPick` function
  - Triggered when timer expires
  - Check team's draft queue
  - Pick highest priority available player
  - Fallback: Pick random available player (if enabled)
  - Fallback: Skip pick (if no auto-pick enabled)
- [ ] Create background job/edge function for timer expiration
  - Check for expired picks every 5 seconds
  - Process auto-picks
  - Or: Use client-side timer with server validation

### 2.4 Draft Queue Actions
- [ ] Create `addPlayerToQueue` server action
  - Validate team ownership
  - Add player to queue with priority
  - Handle duplicate prevention
- [ ] Create `removePlayerFromQueue` server action
  - Validate team ownership
  - Remove player from queue
- [ ] Create `reorderQueue` server action
  - Validate team ownership
  - Update priorities
- [ ] Create `getTeamQueue` server action
  - Return team's queue ordered by priority

---

## Stage 3: Access Control & Permissions

### 3.1 Update RLS Policies
- [ ] Update `draft_picks` SELECT policy
  - Allow all league members to view picks
- [ ] Update `draft_picks` INSERT/UPDATE policy
  - Allow team owners to update their own picks (when it's their turn)
  - Keep commissioner full access
- [ ] Add validation in server actions
  - Check turn order before allowing pick
  - Check draft status before allowing actions

### 3.2 Draft Page Access
- [ ] Update `/leagues/[id]/draft/page.tsx`
  - Remove commissioner-only restriction
  - Allow all league members to view
  - Show different UI based on user role
  - Show "on the clock" indicator for current team owner

### 3.3 Permission Helpers
- [ ] Create `canMakePick` helper function
  - Check if user's team is up
  - Check if draft is active
  - Check if pick is available
- [ ] Create `isDraftCommissioner` helper function
- [ ] Create `getUserTeamInLeague` helper function

---

## Stage 4: Realtime Updates

### 4.1 Supabase Realtime Setup
- [ ] Enable Realtime on `draft_picks` table
  - Publish INSERT, UPDATE events
- [ ] Enable Realtime on `leagues` table
  - Publish UPDATE events (for draft_status changes)

### 4.2 Realtime Hook
- [ ] Create `useDraftRealtime` custom hook
  - Subscribe to draft_picks changes
  - Subscribe to league draft_status changes
  - Return latest draft state
  - Handle connection errors
  - Auto-reconnect logic

### 4.3 Draft Board Realtime Integration
- [ ] Update `DraftBoard` component
  - Use `useDraftRealtime` hook
  - Auto-update when picks are made
  - Show "live" indicator
  - Handle optimistic updates
  - Show connection status

---

## Stage 5: Draft Timer System

### 5.1 Timer Component
- [ ] Create `DraftTimer` component
  - Display countdown for current pick
  - Show time remaining
  - Visual countdown (progress bar/circle)
  - Warning states (30s, 10s remaining)
  - Expired state

### 5.2 Timer Logic
- [ ] Calculate `pick_due_at` when pick becomes active
  - Based on draft_settings.timer_seconds
  - Store in database
- [ ] Client-side countdown
  - Calculate from `pick_due_at` timestamp
  - Update every second
  - Handle timezone differences
- [ ] Server-side validation
  - Verify timer hasn't expired before accepting pick
  - Auto-pick if expired

### 5.3 Timer Management (Commissioner)
- [ ] Add "Pause Timer" button (commissioner only)
- [ ] Add "Resume Timer" button (commissioner only)
- [ ] Add "Extend Timer" button (commissioner only)
- [ ] Update timer display when paused

---

## Stage 6: Draft Queue UI

### 6.1 Queue Component
- [ ] Create `DraftQueue` component
  - Display team's queue
  - Show priority order
  - Drag-and-drop reordering
  - Add/remove players
  - Show which players are already drafted

### 6.2 Queue Integration
- [ ] Add queue panel to draft board
  - Sidebar or bottom panel
  - Toggle show/hide
  - Mobile-friendly layout
- [ ] Quick-add to queue from player list
  - "Add to Queue" button on each player
  - Priority selector
- [ ] Queue status indicators
  - Show if player is in queue
  - Show queue position

---

## Stage 7: Enhanced Draft Room UI

### 7.1 Layout Improvements
- [ ] Create `DraftRoom` container component
  - Split-screen layout (draft board + player list)
  - Responsive breakpoints
  - Mobile-first design
- [ ] Draft board enhancements
  - Better visualization (grid/table)
  - Color-coded by team
  - Highlight current pick
  - Show team names/colors
  - Recent picks section

### 7.2 Player List Enhancements
- [ ] Create `DraftPlayerList` component
  - Enhanced search (debounced)
  - Multi-filter support (position, team, availability)
  - Sort options (name, position, ADP, projected points)
  - Virtual scrolling for performance
  - Player detail modal
  - "My Team" roster preview

### 7.3 Draft Status Panel
- [ ] Create `DraftStatusPanel` component
  - Current pick info
  - Next few picks preview
  - Draft progress (round/pick count)
  - Team roster summaries
  - Draft settings display

### 7.4 Visual Polish
- [ ] Add pick animations
  - Fade-in for new picks
  - Highlight animation for current pick
  - Success animation on pick made
- [ ] Progress indicators
  - Overall draft progress bar
  - Round progress
  - Team pick count
- [ ] Loading states
  - Skeleton loaders
  - Optimistic UI updates

---

## Stage 8: Mobile Optimization

### 8.1 Mobile Layout
- [ ] Responsive draft board
  - Stack layout on mobile
  - Swipeable tabs/sections
  - Bottom sheet for player selection
- [ ] Touch-friendly controls
  - Larger tap targets
  - Swipe gestures
  - Pull-to-refresh

### 8.2 Mobile Draft Experience
- [ ] Simplified mobile view
  - Current pick prominent
  - Quick pick button
  - Queue quick access
  - Minimized draft board
- [ ] Mobile navigation
  - Tab bar for sections
  - Back button handling
  - Deep linking support

### 8.3 Performance Optimization
- [ ] Virtual scrolling for large player lists
- [ ] Lazy loading of draft board rounds
- [ ] Image optimization for player photos
- [ ] Debounced search/filter

---

## Stage 9: Draft Completion & Finalization

### 9.1 Draft Completion Logic
- [ ] Auto-detect draft completion
  - Check when last pick is made
  - Trigger completion automatically
- [ ] Finalization process
  - Validate all picks are made
  - Finalize all rosters
  - Create final transaction records
  - Update league status
  - Send completion notifications

### 9.2 Post-Draft Actions
- [ ] Draft summary view
  - All picks by team
  - Draft grades/analysis (future)
  - Export draft results
- [ ] Roster verification
  - Show final rosters
  - Allow commissioner adjustments (if needed)
  - Lock rosters for season start

---

## Stage 10: Error Handling & Edge Cases

### 10.1 Error Scenarios
- [ ] Handle network errors
  - Retry logic for failed picks
  - Offline detection
  - Queue picks for retry
- [ ] Handle concurrent picks
  - Prevent double-picking
  - Optimistic locking
  - Conflict resolution
- [ ] Handle timer edge cases
  - Timer expires during pick
  - Multiple users on same team
  - Clock sync issues

### 10.2 Validation & Safety
- [ ] Comprehensive input validation
- [ ] Rate limiting on pick actions
- [ ] Audit logging for draft actions
- [ ] Rollback capability (commissioner)
- [ ] Draft reset functionality (dev only)

---

## Stage 11: Testing

### 11.1 Unit Tests
- [ ] Test draft helper functions
- [ ] Test server actions
- [ ] Test timer calculations
- [ ] Test queue logic

### 11.2 Integration Tests
- [ ] Test draft flow end-to-end
- [ ] Test realtime updates
- [ ] Test timer expiration
- [ ] Test auto-pick functionality
- [ ] Test queue operations

### 11.3 Manual Testing
- [ ] Multi-user draft simulation
- [ ] Mobile device testing
- [ ] Network interruption testing
- [ ] Timer accuracy testing
- [ ] Edge case scenarios

### 11.4 Performance Testing
- [ ] Load test with many concurrent users
- [ ] Test with large player lists (1000+ players)
- [ ] Test realtime subscription performance
- [ ] Memory leak detection

---

## Stage 12: Analytics & Monitoring

### 12.1 Draft Analytics
- [ ] Track draft start/completion
- [ ] Track pick timing
- [ ] Track queue usage
- [ ] Track auto-pick usage
- [ ] Track draft duration

### 12.2 Error Monitoring
- [ ] Log draft errors
- [ ] Monitor realtime connection issues
- [ ] Track failed picks
- [ ] Alert on critical errors

---

## Stage 13: Documentation

### 13.1 User Documentation
- [ ] Draft guide for team owners
- [ ] Commissioner draft guide
- [ ] FAQ for common issues
- [ ] Video tutorials (optional)

### 13.2 Developer Documentation
- [ ] Code comments
- [ ] Architecture documentation
- [ ] API documentation
- [ ] Deployment guide

---

## Stage 14: Deployment

### 14.1 Pre-Deployment
- [ ] Code review
- [ ] Security audit
- [ ] Performance optimization
- [ ] Database migration testing
- [ ] Backup strategy

### 14.2 Staging Deployment
- [ ] Deploy to staging environment
- [ ] Full end-to-end testing
- [ ] User acceptance testing
- [ ] Load testing
- [ ] Bug fixes

### 14.3 Production Deployment
- [ ] Feature flag setup
- [ ] Gradual rollout plan
- [ ] Database migrations
- [ ] Deploy to production
- [ ] Monitor closely
- [ ] Rollback plan ready

### 14.4 Post-Deployment
- [ ] Monitor error rates
- [ ] Monitor performance
- [ ] Collect user feedback
- [ ] Iterate based on feedback
- [ ] Document lessons learned

---

## Priority Order for Implementation

### Phase 1: MVP (Weeks 1-2)
1. Stage 1: Database Foundation
2. Stage 2: Backend - Draft State Management (basic)
3. Stage 3: Access Control & Permissions
4. Stage 4: Realtime Updates (basic)
5. Stage 5: Draft Timer System (basic)
6. Stage 7: Enhanced Draft Room UI (basic)

### Phase 2: Full Features (Weeks 3-4)
7. Stage 6: Draft Queue UI
8. Stage 2: Auto-Pick Logic
9. Stage 8: Mobile Optimization
10. Stage 9: Draft Completion & Finalization

### Phase 3: Polish & Production (Weeks 5-6)
11. Stage 10: Error Handling & Edge Cases
12. Stage 11: Testing
13. Stage 12: Analytics & Monitoring
14. Stage 13: Documentation
15. Stage 14: Deployment

---

## Quick Start: Next 5 Tasks

1. **Create database migration** for draft status fields (Stage 1.1)
2. **Update RLS policies** to allow team owners (Stage 3.1)
3. **Create `makeDraftPick` action** for team owners (Stage 2.2)
4. **Update draft page** to allow all league members (Stage 3.2)
5. **Add turn validation** logic (Stage 2.2)

These 5 tasks will enable basic team owner participation, which is the foundation for everything else.

