# Draft System - Testing Guide

## Overview

This guide provides comprehensive testing procedures for the draft system, including manual testing checklists, integration test scenarios, and performance testing guidelines.

## Table of Contents

1. [Manual Testing Checklist](#manual-testing-checklist)
2. [Integration Test Scenarios](#integration-test-scenarios)
3. [Performance Testing](#performance-testing)
4. [Edge Case Testing](#edge-case-testing)
5. [Mobile Testing](#mobile-testing)
6. [Browser Compatibility](#browser-compatibility)

## Manual Testing Checklist

### Pre-Draft Setup

#### Commissioner Actions
- [ ] **Generate Draft Picks**
  - Navigate to draft page
  - Click "Generate Draft" button
  - Verify picks are created for all teams
  - Verify snake draft order is correct
  - Verify number of rounds matches settings

- [ ] **Configure Draft Settings**
  - Open draft settings panel
  - Set timer duration (test: 30s, 60s, 90s, 120s)
  - Toggle auto-pick enabled/disabled
  - Set number of rounds
  - Verify settings are saved

- [ ] **Start Draft**
  - Click "Start Draft" button
  - Verify draft status changes to "in_progress"
  - Verify first pick timer starts
  - Verify all users see draft as started
  - Check analytics event is tracked

### During Draft

#### Team Owner Actions
- [ ] **Make a Pick**
  - Wait for your turn
  - Click on your pick slot
  - Search for a player
  - Select a player
  - Verify pick is made immediately
  - Verify player appears in your roster
  - Verify next pick timer starts
  - Check realtime update works

- [ ] **Add to Queue**
  - Browse available players
  - Click "+ Queue" on a player
  - Verify player appears in queue
  - Verify queue length updates
  - Check analytics event

- [ ] **Remove from Queue**
  - Click "X" on a queued player
  - Verify player is removed
  - Verify queue updates

- [ ] **Reorder Queue**
  - Drag and drop players (desktop)
  - Verify priority changes
  - Verify order persists
  - Check analytics event

- [ ] **Search Players**
  - Type player name
  - Verify results filter
  - Type team name
  - Verify results filter
  - Clear search
  - Verify all players show

- [ ] **Filter by Position**
  - Select each position filter
  - Verify only that position shows
  - Select "All"
  - Verify all positions show

- [ ] **Sort Players**
  - Test each sort option (Name, Position, Team, Bye)
  - Verify ascending/descending toggle
  - Verify sort persists during search

#### Commissioner Actions During Draft
- [ ] **Pause Draft**
  - Click "Pause Draft"
  - Verify draft status changes to "paused"
  - Verify timer stops
  - Verify all users see paused status
  - Check analytics event

- [ ] **Resume Draft**
  - Click "Resume Draft"
  - Verify draft status changes to "in_progress"
  - Verify timer restarts
  - Verify all users see resumed status
  - Check analytics event

- [ ] **Extend Timer**
  - Click "+30s" or "+60s"
  - Verify timer extends correctly
  - Verify time remaining increases
  - Check analytics event with time remaining

- [ ] **Make Pick for Any Team** (Commissioner Override)
  - Click on any unpicked slot
  - Select a player
  - Verify pick is made
  - Verify next pick advances

### Timer Expiration

- [ ] **Auto-Pick from Queue**
  - Add players to queue
  - Let timer expire
  - Verify highest priority player is picked
  - Verify pick is made automatically
  - Check analytics event

- [ ] **Auto-Pick Random** (Queue Empty)
  - Clear queue
  - Enable auto-pick
  - Let timer expire
  - Verify random player is picked
  - Check analytics event

- [ ] **Skip Pick** (Auto-Pick Disabled)
  - Disable auto-pick
  - Clear queue
  - Let timer expire
  - Verify pick is skipped (no player assigned)
  - Verify draft advances to next pick
  - Verify commissioner can assign later

### Post-Draft

- [ ] **Draft Completion**
  - Complete all picks (or let auto-pick finish)
  - Verify draft status changes to "completed"
  - Verify draft summary appears
  - Verify all rosters are complete
  - Check analytics event

- [ ] **Draft Summary View**
  - Verify statistics display correctly
  - Verify team roster summaries
  - Verify detailed roster views
  - Verify pick-by-pick breakdown
  - Test navigation between views

- [ ] **Roster Verification**
  - Check each team's roster
  - Verify all drafted players are in rosters
  - Verify initial slot type is "BENCH"
  - Verify transaction records exist

## Integration Test Scenarios

### Scenario 1: Complete Draft Flow
1. Commissioner generates picks
2. Commissioner starts draft
3. Team 1 makes pick manually
4. Team 2 uses queue auto-pick
5. Team 3 lets timer expire (auto-pick enabled)
6. Commissioner pauses for break
7. Commissioner resumes draft
8. Commissioner extends timer for Team 4
9. Continue until all picks made
10. Verify draft completes automatically
11. Verify all rosters are complete

**Expected Results:**
- All picks are made
- All rosters have correct players
- All transactions are recorded
- Draft status is "completed"
- Analytics events are tracked

### Scenario 2: Concurrent Pick Protection
1. Two users try to pick simultaneously
2. User A clicks pick button
3. User B clicks same pick button immediately after
4. Verify only one pick succeeds
5. Verify other user gets error message
6. Verify UI updates correctly for both users

**Expected Results:**
- Only first pick succeeds
- Second user sees "already been made" error
- Both UIs update via realtime
- No duplicate picks

### Scenario 3: Network Interruption
1. Start making a pick
2. Disconnect network mid-request
3. Verify error message appears
4. Reconnect network
5. Verify retry logic works
6. Verify pick eventually succeeds

**Expected Results:**
- Error message shows
- Retry logic attempts 2 more times
- Pick succeeds on retry
- UI updates correctly

### Scenario 4: Realtime Connection Loss
1. Open draft page
2. Disconnect network
3. Verify connection status indicator shows disconnected
4. Make a pick (should fail gracefully)
5. Reconnect network
6. Verify connection status updates
7. Verify draft state syncs

**Expected Results:**
- Connection indicator shows status
- Picks fail gracefully when disconnected
- Reconnection works automatically
- State syncs on reconnect

### Scenario 5: Queue Auto-Pick Priority
1. Add 3 players to queue (A, B, C in that order)
2. Player B gets drafted by another team
3. Let timer expire
4. Verify Player A is picked (highest priority available)
5. Verify Player C remains in queue

**Expected Results:**
- Highest priority available player is picked
- Drafted players are skipped
- Queue updates correctly

## Performance Testing

### Load Testing

#### Large Player Database
- [ ] Test with 500+ players
- [ ] Verify search performance (< 100ms)
- [ ] Verify filter performance (< 50ms)
- [ ] Verify lazy loading works
- [ ] Verify scroll performance is smooth

#### Many Teams
- [ ] Test with 12+ teams
- [ ] Verify draft board renders quickly
- [ ] Verify realtime updates don't lag
- [ ] Verify all teams can make picks

#### Long Drafts
- [ ] Test 16+ round draft
- [ ] Verify performance doesn't degrade
- [ ] Verify memory usage is reasonable
- [ ] Verify no memory leaks

### Stress Testing

#### Rapid Picks
- [ ] Make 10 picks in quick succession
- [ ] Verify no errors occur
- [ ] Verify all picks are recorded
- [ ] Verify UI stays responsive

#### Multiple Users
- [ ] Test with 10+ concurrent users
- [ ] Verify realtime updates work for all
- [ ] Verify no performance degradation
- [ ] Verify no race conditions

#### Large Queue
- [ ] Add 50+ players to queue
- [ ] Verify queue renders quickly
- [ ] Verify reordering works smoothly
- [ ] Verify no performance issues

## Edge Case Testing

### Invalid States

- [ ] **Pick Already Made**
  - Try to pick a slot that's already picked
  - Verify error message
  - Verify UI doesn't break

- [ ] **Player Already Drafted**
  - Try to pick a player already drafted
  - Verify error message
  - Verify player is filtered from list

- [ ] **Not Your Turn**
  - Try to pick when it's not your turn
  - Verify error message
  - Verify pick button is disabled

- [ ] **Draft Not Started**
  - Try to make pick before draft starts
  - Verify error message
  - Verify UI prevents action

- [ ] **Draft Paused**
  - Try to make pick when draft is paused
  - Verify error message
  - Verify timer shows paused

- [ ] **Draft Completed**
  - Try to make pick after draft completes
  - Verify error message
  - Verify summary view shows

### Timer Edge Cases

- [ ] **Timer Expires During Pick**
  - Start making pick
  - Let timer expire while selecting
  - Verify pick can still complete
  - Verify next pick timer starts

- [ ] **Extend Timer Multiple Times**
  - Extend timer 3+ times
  - Verify timer keeps extending
  - Verify analytics tracks each extension

- [ ] **Timer Drift**
  - Leave page open for 10+ minutes
  - Verify timer stays accurate
  - Verify no clock drift issues

### Queue Edge Cases

- [ ] **Add Same Player Twice**
  - Try to add player already in queue
  - Verify error message
  - Verify queue doesn't duplicate

- [ ] **Queue Full of Drafted Players**
  - Add only drafted players to queue
  - Let timer expire
  - Verify auto-pick falls back to random
  - Verify queue is cleared of drafted players

- [ ] **Reorder Empty Queue**
  - Try to reorder empty queue
  - Verify no errors
  - Verify UI handles gracefully

## Mobile Testing

### Touch Interactions

- [ ] **Touch Targets**
  - Verify all buttons are at least 44px
  - Verify no hover-only interactions
  - Verify tap targets are spaced properly

- [ ] **Swipe Gestures**
  - Test swiping in player list
  - Test swiping in queue
  - Verify gestures don't conflict

- [ ] **Bottom Sheets**
  - Test opening/closing queue sheet
  - Test opening/closing player list sheet
  - Verify animations are smooth
  - Verify backdrop works correctly

### Mobile-Specific Features

- [ ] **Quick Pick Button**
  - Verify appears only when it's your turn
  - Verify picks from queue correctly
  - Verify falls back to top player
  - Verify loading state shows

- [ ] **Floating Action Buttons**
  - Verify FABs don't overlap content
  - Verify FABs are accessible
  - Verify FABs work on all screen sizes

- [ ] **Responsive Layout**
  - Test on phone (375px width)
  - Test on tablet (768px width)
  - Verify layout adapts correctly
  - Verify no horizontal scrolling

### Mobile Performance

- [ ] **Load Time**
  - Verify page loads in < 3s on 3G
  - Verify page loads in < 1s on 4G
  - Verify lazy loading works

- [ ] **Battery Usage**
  - Monitor battery during draft
  - Verify realtime doesn't drain battery
  - Verify no excessive re-renders

## Browser Compatibility

### Desktop Browsers

- [ ] **Chrome** (latest)
  - All features work
  - No console errors
  - Performance is good

- [ ] **Firefox** (latest)
  - All features work
  - No console errors
  - Performance is good

- [ ] **Safari** (latest)
  - All features work
  - No console errors
  - Performance is good

- [ ] **Edge** (latest)
  - All features work
  - No console errors
  - Performance is good

### Mobile Browsers

- [ ] **iOS Safari**
  - All features work
  - Touch interactions work
  - Performance is good

- [ ] **Chrome Mobile**
  - All features work
  - Touch interactions work
  - Performance is good

- [ ] **Samsung Internet**
  - All features work
  - Touch interactions work
  - Performance is good

## Accessibility Testing

- [ ] **Keyboard Navigation**
  - Tab through all interactive elements
  - Verify focus indicators are visible
  - Verify Enter/Space activate buttons
  - Verify Esc closes modals

- [ ] **Screen Readers**
  - Test with VoiceOver (iOS/Mac)
  - Test with NVDA (Windows)
  - Verify all content is announced
  - Verify ARIA labels are correct

- [ ] **Color Contrast**
  - Verify text meets WCAG AA standards
  - Verify interactive elements are distinguishable
  - Verify error states are clear

- [ ] **Focus Management**
  - Verify focus moves to modals when opened
  - Verify focus returns when modals close
  - Verify focus is trapped in modals

## Security Testing

- [ ] **Authentication**
  - Verify unauthenticated users can't make picks
  - Verify users can't make picks for other teams
  - Verify RLS policies work correctly

- [ ] **Rate Limiting**
  - Try to make 20 picks in 1 minute
  - Verify rate limit kicks in
  - Verify error message is clear
  - Verify limit resets correctly

- [ ] **Input Validation**
  - Try to submit invalid data
  - Verify validation errors
  - Verify no SQL injection possible
  - Verify no XSS possible

## Regression Testing

After each deployment, verify:

- [ ] All manual test cases pass
- [ ] No console errors
- [ ] No performance degradation
- [ ] Analytics events are tracked
- [ ] Error monitoring works
- [ ] Mobile experience works
- [ ] Documentation is up to date

## Test Data Setup

### Test League
- Create test league with 4-6 teams
- Assign test users to teams
- Generate draft picks
- Use for all manual testing

### Test Players
- Ensure player database has 200+ players
- Include players from all positions
- Include players from multiple teams
- Include players with various bye weeks

## Reporting Issues

When reporting bugs, include:

1. **Steps to Reproduce**
   - Detailed step-by-step instructions
   - Expected vs actual behavior

2. **Environment**
   - Browser and version
   - Device type (desktop/mobile)
   - Screen size
   - Network conditions

3. **Error Information**
   - Console errors (if any)
   - Network errors (if any)
   - Screenshots/videos

4. **Analytics**
   - Check PostHog for related events
   - Check Supabase logs for errors
   - Include timestamps

## Automated Testing (Future)

### Unit Tests
- Server action validation
- Helper function calculations
- Component rendering
- Hook behavior

### Integration Tests
- Full draft flow
- Realtime updates
- Error handling
- Analytics tracking

### E2E Tests
- Complete draft scenario
- Mobile interactions
- Cross-browser compatibility
- Performance benchmarks

