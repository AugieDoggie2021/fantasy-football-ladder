# Draft System - User Guide

## Overview

The Draft System allows league commissioners to run live fantasy football drafts with real-time updates, timers, and queue management. Team owners can make picks, manage their draft queue, and view the draft board in real-time.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Commissioner Guide](#commissioner-guide)
3. [Team Owner Guide](#team-owner-guide)
4. [Draft Queue](#draft-queue)
5. [Mobile Experience](#mobile-experience)
6. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- You must be a member of a league
- The league must have teams assigned
- The commissioner must generate draft picks before starting the draft

### Accessing the Draft

1. Navigate to your league page
2. Click on the "Draft" tab or navigate to `/leagues/[league-id]/draft`
3. You'll see the draft board with all picks organized by round

## Commissioner Guide

### Generating Draft Picks

Before starting a draft, the commissioner must generate draft picks:

1. Go to the draft page
2. Click "Generate Draft" button
3. The system will create a snake draft order based on team draft positions
4. Default is 14 rounds, but this can be configured in draft settings

### Starting the Draft

1. Click the "Start Draft" button
2. The draft status will change to "in_progress"
3. The first team's timer will begin counting down
4. All league members will see real-time updates

### Draft Controls

**Pause Draft**
- Pauses the draft and stops all timers
- Useful for breaks or resolving issues
- Only the commissioner can pause

**Resume Draft**
- Resumes a paused draft
- Restarts the timer for the current pick
- Only the commissioner can resume

**Complete Draft**
- Manually completes the draft
- Finalizes all rosters
- Only use if all picks are made

**Extend Timer**
- Adds 30 or 60 seconds to the current pick's timer
- Useful if a team owner needs more time
- Only the commissioner can extend timers

### Draft Settings

Configure draft settings before starting:

- **Timer Duration**: How long each team has to make a pick (default: 90 seconds)
- **Auto-Pick Enabled**: Whether to automatically pick from queue or randomly when timer expires
- **Rounds**: Number of draft rounds (default: 14)

## Team Owner Guide

### Making a Pick

When it's your turn to pick:

1. The draft board will highlight your current pick
2. You'll see a "It's your turn!" message
3. Click on your pick slot to open the player selection modal
4. Search or filter players
5. Click on a player to select them
6. Your pick will be made immediately

### Quick Pick (Mobile)

On mobile devices, you can use the Quick Pick button:
- Automatically picks from your queue (highest priority)
- Falls back to top available player if queue is empty
- Only available when it's your turn

### Viewing Draft Status

The draft status panel shows:
- Current pick number and team
- Overall draft progress (percentage)
- Round progress
- Your team's pick count
- Upcoming picks preview

## Draft Queue

### What is the Draft Queue?

The draft queue allows you to pre-select players you want to draft. When it's your turn, the system can automatically pick from your queue if enabled.

### Adding Players to Queue

1. Browse available players in the player list
2. Click the "+ Queue" button next to any player
3. Players are added in priority order (newest = highest priority)

### Managing Your Queue

**View Queue**
- Desktop: Queue panel on the right side
- Mobile: Tap the "Queue" floating action button

**Reorder Queue**
- Desktop: Drag and drop players to reorder
- Mobile: Use the reorder controls in the queue sheet

**Remove from Queue**
- Click the "X" button next to any player
- Player will be removed immediately

### Queue Priority

- Higher priority players are picked first
- Priority is set automatically when adding (newest = highest)
- You can manually reorder to change priorities

## Mobile Experience

### Floating Action Buttons (FABs)

On mobile devices, you'll see three floating action buttons:

1. **Quick Pick** (only when it's your turn)
   - Instantly picks from your queue or top available player

2. **Queue**
   - Opens your draft queue in a bottom sheet

3. **Players**
   - Opens the full player list in a bottom sheet

### Bottom Sheets

Mobile uses bottom sheets for:
- Draft queue management
- Player list browsing
- Better touch interaction and screen space usage

### Touch-Friendly Controls

All buttons and controls are optimized for touch:
- Minimum 44px touch targets
- No hover states (mobile-friendly)
- Swipe gestures for navigation

## Player Selection

### Search and Filter

**Search**
- Type player name or team name
- Search is debounced (waits 300ms after typing stops)
- Searches both player names and NFL teams

**Position Filter**
- Filter by position: QB, RB, WR, TE, K, DEF
- Select "All" to show all positions

**Sort Options**
- **Name**: Alphabetical by player name
- **Position**: Grouped by position, then name
- **Team**: Grouped by NFL team, then name
- **Bye Week**: Sorted by bye week, then name

### Lazy Loading

The player list loads in batches:
- Initially shows 50 players
- Loads 50 more when scrolling near bottom
- Improves performance with large player databases

## Draft Board

### Understanding the Board

- **Rounds**: Each round is displayed as a section
- **Picks**: Each pick shows:
  - Pick number (overall)
  - Team name
  - Selected player (if picked)
  - Status indicators

### Visual Indicators

- **Yellow Highlight**: Current pick (on the clock)
- **Green Highlight**: Recently picked (animation)
- **Gray**: Completed picks
- **Blue Border**: Your team's picks

### Real-Time Updates

- All picks update in real-time via WebSocket
- No need to refresh the page
- Connection status shown at top of draft board

## Timer System

### How Timers Work

- Each pick has a countdown timer
- Timer starts when the pick becomes current
- Timer pauses when draft is paused
- Timer can be extended by commissioner

### Timer States

- **Active**: Green/yellow countdown
- **Warning**: Yellow when ≤30 seconds remaining
- **Critical**: Red and pulsing when ≤10 seconds remaining
- **Expired**: Red "Time expired" message

### Auto-Pick on Expiration

If timer expires and auto-pick is enabled:
1. System checks your draft queue
2. Picks highest priority available player
3. If queue is empty, picks random available player
4. If auto-pick disabled, pick is skipped (commissioner can assign later)

## Post-Draft

### Draft Summary

After draft completion, you'll see:
- Draft statistics (total picks, duration, etc.)
- Team roster summaries
- Detailed roster views
- Pick-by-pick breakdown

### Roster Verification

The system automatically:
- Creates roster entries for all drafted players
- Sets initial slot type to "BENCH"
- Creates transaction records
- Validates all picks are complete

## Troubleshooting

### "It's not your turn" Error

- Wait for your turn
- Check the draft status panel for current pick
- Refresh the page if draft seems stuck

### Pick Not Showing

- Check your internet connection
- Look for connection status indicator
- Refresh the page if realtime connection is lost

### Timer Not Updating

- Timer updates every second on client
- If stuck, refresh the page
- Check if draft is paused

### Queue Not Working

- Ensure you're logged in
- Verify you own the team
- Check that draft is in progress
- Try refreshing the page

### Mobile Issues

- Ensure you're using a modern browser
- Check for JavaScript errors in console
- Try clearing browser cache
- Use landscape mode for better view

## Best Practices

### For Commissioners

1. **Test Before Draft Day**
   - Generate picks in advance
   - Test with a few picks
   - Verify all teams can access

2. **Communicate Settings**
   - Share timer duration with league
   - Explain auto-pick rules
   - Set expectations for breaks

3. **Monitor During Draft**
   - Watch for connection issues
   - Be ready to pause if needed
   - Extend timers for technical issues

### For Team Owners

1. **Prepare Your Queue**
   - Add players before your turn
   - Prioritize your targets
   - Update queue as players are drafted

2. **Stay Connected**
   - Keep page open during draft
   - Watch for your turn
   - Use mobile app if away from computer

3. **Be Ready**
   - Have backup picks in queue
   - Monitor other teams' picks
   - Adjust strategy as draft progresses

## Keyboard Shortcuts

- **Space**: Quick pick (when it's your turn)
- **Q**: Open queue (desktop)
- **P**: Open player list (desktop)
- **Esc**: Close modals/sheets

## Support

If you encounter issues:
1. Check this guide first
2. Contact your league commissioner
3. Report bugs with:
   - Browser and version
   - Device type
   - Error messages
   - Steps to reproduce

