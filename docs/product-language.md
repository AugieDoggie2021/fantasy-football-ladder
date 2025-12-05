# Product Language Glossary

This document defines the mapping between internal database/data model terms and user-facing product language used throughout the Fantasy Football Ladder application.

## Purpose

The database schema uses technical terms that reflect the data model. However, the user interface (UI) must use product language that feels natural to fantasy football players. This document ensures consistency and prevents re-introduction of technical terms into the UI.

## Core Terminology Mappings

### Promotion Groups → Ladders

- **Database/Internal**: `promotion_group`, `promotion_groups`
- **User-Facing**: "Ladder" (singular), "Ladders" (plural)
- **Usage**: All UI text, headings, navigation labels, button text, and route labels should use "Ladder" terminology
- **Examples**:
  - "My Ladders" (not "My Promotion Groups")
  - "Create Ladder" (not "Create Promotion Group")
  - "Ladder Overview" (not "Promotion Group Overview")

### League Weeks → Weeks

- **Database/Internal**: `league_week`, `league_weeks`
- **User-Facing**: "Week" or "Week X" (e.g., "Week 3", "Week 5 Matchups")
- **Usage**: Display week numbers and week-related sections
- **Examples**:
  - "Week 3 Matchups" (not "League Week 3 Matchups")
  - "Current Week: 5" (not "Current League Week: 5")
  - "This Week's Scores" (not "This League Week's Scores")

### Seasons

- **Database/Internal**: `season`, `seasons`
- **User-Facing**: "Season" (e.g., "2024 Season")
- **Usage**: Season selection is mostly hidden from users; the system automatically infers the active NFL season when creating leagues
- **Note**: The `/seasons` page is admin-only and clearly labeled as "Season Configuration (Admin)"

### Rosters → Lineups/Teams

- **Database/Internal**: `roster`, `rosters`, `roster_slot`
- **User-Facing**: 
  - Main section: "My Team" or "My Lineup"
  - Subsections: "Starting Lineup" (for `is_starter = true`), "Bench" (for `is_starter = false`)
- **Usage**: Team roster displays and management
- **Examples**:
  - "My Lineup" (not "My Roster")
  - "Starting Lineup" (not "Starters" or "Starting Roster")
  - "Edit Lineup" (not "Edit Roster")

### Transactions → Activity

- **Database/Internal**: `transaction`, `transactions`, transaction types (`add`, `drop`, `waiver_add`, `waiver_drop`, `trade`)
- **User-Facing**: 
  - Section heading: "Recent Activity" or "Recent League Activity"
  - Transaction types mapped to human-readable labels:
    - `add` → "Added"
    - `drop` → "Dropped"
    - `waiver_add` → "Claimed off Waivers"
    - `waiver_drop` → "Dropped (Waivers)"
    - `trade` → "Traded"
- **Usage**: Display league activity and player moves
- **Examples**:
  - "Tom added J. Chase (CIN · WR)" (not "Transaction: ADD - Tom added J. Chase")
  - "Kaylee dropped T. Higgins (CIN · WR)" (not "Transaction: DROP - Kaylee dropped T. Higgins")
  - "Recent Activity" (not "Recent Transactions")

### Scoring & Stats

- **Database/Internal**: `fantasy_points`, `cached_fantasy_points`, `player_week_stats`
- **User-Facing**: 
  - "Points" (not "Fantasy Points" or "Cached Fantasy Points")
  - "Player Stats This Week" (not "Player Week Stats")
  - "Total Points" (not "Total Fantasy Points")
- **Usage**: Score displays, standings, and player stats
- **Examples**:
  - Column header: "Points" (not "Fantasy Points")
  - "This Week's Matchups" (not "This League Week's Matchups")
  - "Week 3 Scoreboard" (not "League Week 3 Scoreboard")

### Status Labels

- **Database/Internal**: Status enums (`completed`, `in_progress`, `scheduled`, `final`)
- **User-Facing**: 
  - `completed` → "Final"
  - `in_progress` → "Live"
  - `scheduled` → "Scheduled"
  - `final` → "Final"
- **Usage**: Week and matchup status displays
- **Examples**:
  - "Final" (not "COMPLETED")
  - "Live" (not "IN_PROGRESS")
  - "Scheduled" (not "SCHEDULED")

## Commissioner Tools Language

Commissioner tools should use user-facing language, not technical verbs:

- **"Ingest stats"** → **"Update Scores from Live Stats"**
- **"Dry-run scoring"** → **"Preview Scores (no changes)"**
- **"Apply scoring"** → **"Finalize Scores for this Week"**
- **"Set current week"** → **"Set Current Week"** (with context: "Season Week: 3")
- **"Advance week"** → **"Advance to Next Week"**

## Developer/Admin Tools

Developer and admin tools are isolated in `/admin` and gated by environment:

- **"Seed demo data"** → **"Create Sample League"**
- **"Sync external players"** → **"Update Players from External Source"**
- **"Sync external stats"** → **"Update Week Stats from External Source"**
- **"Ingest stats"** → **"Update Scores from Live Stats"** (in dev tools context)

These tools are only visible when `NEXT_PUBLIC_APP_ENV === 'dev'`.

## Implementation Guidelines

1. **Database names stay the same**: Do not rename database tables, columns, or enums. This is purely a UI/UX pass.

2. **Component props and variables**: Internal code can use database terms (e.g., `promotionGroupId`), but all user-facing text must use product language.

3. **Route paths**: Internal route paths can use database terms (e.g., `/promotion-groups/[id]`), but visible links, breadcrumbs, and navigation should use product language (e.g., "Ladder" in the UI).

4. **Consistency**: Use the same terminology throughout the application. If you see "Promotion Group" in the UI, it should be changed to "Ladder".

5. **Documentation**: When adding new features, update this glossary if new terminology mappings are introduced.

## Examples of Correct Usage

✅ **Correct**:
- "My Ladders" (dashboard)
- "Create League in this Ladder" (button)
- "Week 3 Matchups" (section heading)
- "Recent Activity" (section heading)
- "Tom added J. Chase (CIN · WR)" (activity item)
- "Finalize Scores for this Week" (commissioner button)

❌ **Incorrect**:
- "My Promotion Groups" (should be "My Ladders")
- "Create League in this Promotion Group" (should be "Create League in this Ladder")
- "League Week 3 Matchups" (should be "Week 3 Matchups")
- "Recent Transactions" (should be "Recent Activity")
- "Transaction: ADD - Tom added J. Chase" (should be "Tom added J. Chase (CIN · WR)")
- "Apply Scoring" (should be "Finalize Scores for this Week")

## Maintenance

This document should be updated whenever:
- New terminology mappings are introduced
- New features require product language decisions
- Inconsistencies are discovered and corrected

---

**Last Updated**: Product Language Cleanup Pass (Tasks 1-8 completed)

