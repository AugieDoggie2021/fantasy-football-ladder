# Fantasy Football Ladder

A modern, ad-free fantasy football platform inspired by the usability of Yahoo Fantasy Sports, redesigned from the ground up for flexibility, multi-league ecosystems, and promotion/relegation league play.

This project includes:

* A **Next.js** web app deployed on **Vercel**
* A **native SwiftUI iOS app**
* A **Supabase backend** providing authentication, data, realtime updates, and server logic
* An architecture designed from day one for **multi-tiered leagues** with **promotion and relegation mechanics**
* Built-in support for **dry-run operations, impersonation, and testing tooling**

---

## Vision

Fantasy Football Ladder reimagines traditional fantasy football gameplay:

* Football-only
* Clean interface, no ads, no betting integration
* Multiple interconnected leagues forming a ladder or pyramid
* Automatic movement of teams between tiers at the end of each season
* A polished native mobile app for iOS alongside a full-featured web experience

---

## Platform Architecture

**Frontend (Web)**

* Framework: Next.js (App Router) + TypeScript
* Data fetching: Supabase client + React Query
* Styling: TailwindCSS
* Auth: Supabase Auth
* Hosting: Vercel

**Mobile App (iOS)**

* Native SwiftUI application
* Secure authentication (Supabase token storage via Keychain)
* Shared data models aligned with web API layer

**Backend**

* Supabase (Postgres, Auth, Storage, Realtime)
* Supabase Edge Functions for:

  * Draft operations
  * Weekly scoring
  * Standings generation
  * Promotion/relegation logic
* Optional API routes (Next.js) acting as a backend-for-frontend

---

## Core Concepts

### Seasons

Each season has phases (preseason → drafting → regular season → playoffs → complete).

### Promotion Groups

A promotion group is a multi-league ecosystem that supports upward and downward movement of teams between tiers.

### Leagues

Each league belongs to a season (and optionally a promotion group and tier) and contains the teams, roster rules, settings, and matchups.

### Promotion & Relegation

At season end:

* Top teams in lower tiers move up
* Bottom teams in upper tiers move down
* New seasons and league alignments are generated programmatically

---

## MVP Specifications & Design Decisions

This section documents the functional requirements and design decisions for the MVP. These are defaults that are architecturally configurable (not hard-coded constants) to preserve future flexibility.

### 1. Player Data & Scoring

**Data Source (MVP)**
* Manual/seeded data for initial development and testing
* No external stats provider integration during MVP
* Player scoring and matchup outcomes manually assigned/simulated via admin tools, scheduled scripts, or test harnesses
* *Rationale:* UI, league logic, and promotion mechanics must work before integrating real-time stats
* **Future:** Integration with Yahoo/Sleeper/SportsData.io/MySportsFeed API post-MVP

**Scoring Rules (MVP)**
* Standard Yahoo-style scoring:
  * PPR on the receiving side
  * Normal TD yardage breakdowns
* MVP supports **one scoring preset** (not fully customizable)
* Scoring engine abstracted for future expansion (additional presets or custom scoring)

**Week Tracking**
* MVP week logic is admin-controlled:
  * Admin can set "current week"
  * Admin can trigger scoring runs
  * Admin can simulate outcomes
* Post-MVP: NFL calendar sync becomes automated

### 2. League Structure & Constraints

**Team Limits per League**
* Default: **10 teams** per league
* Future: Configurable expansion to 8–14 team leagues

**Tiers per Promotion Group**
* MVP: **3 tiers** per promotion group
* Long-term: Unlimited tiers supported (UI constraints evolve later)

**Promotion / Relegation Rules**
* MVP:
  * **Top 3 teams move up**
  * **Bottom 3 teams move down**
* Movement ignored if no adjacent tier exists (top tier cannot promote upward, bottom tier cannot relegate)

**Multi-Group Participation**
* **Yes** — Users may participate in multiple promotion groups simultaneously
* Each team is scoped to a league, not to a user profile globally

### 3. Roster & Draft Mechanics

**Roster Structure (MVP)**
* Starting lineup:
  * QB
  * 2 × RB
  * 2 × WR
  * TE
  * FLEX (RB/WR/TE)
  * K
  * DEF
* 6 bench slots
* **Total: 14 players per team**

**Draft Format**
* MVP: **Snake draft only**
* Auction draft: Post-MVP enhancement

**Draft Timing**
* MVP drafts are **manual**:
  * Commissioner triggers the draft
  * No NFL lock-in
  * Can be run anytime
* Timer enforcement and auto-pick: Stretch goals

### 4. Season Lifecycle & Playoffs

**Playoff System (MVP)**
* Standard **4-team playoffs (weeks 14–15)**
* Weeks not hard-coded to NFL dates; can be simulated/tested

**Promotion Timing**
* Promotions/relegations occur **after playoffs conclude**
* Based on **final league standings** (not strictly regular-season results)
* Future enhancement: Toggle setting for "Promotion rules based on regular season only"

### 5. MVP Scope & Target Users

**MVP Deliverable Definition**
A deployable private beta where:
* Web + iOS users can:
  * Create accounts
  * Join leagues
  * Draft teams
  * Manage rosters
  * Play through simulated weeks
  * See standings
  * Experience promotion/relegation at season end
* UI exists for:
  * Admin scoring
  * Season status changes
  * Promotion dry-run preview and execution

This constitutes **"Phase 5 complete"** in the Roadmap.

**Target Users**
* **Closed private beta with ~10–30 friends + family**
* Public launch is post-MVP (after data automation and polish phases)

### 6. Commissionership & Governance

**Creation & Ownership**
* **Any authenticated user may create a promotion group**
* Creator becomes **commissioner for that group**
* Only commissioners can:
  * Add/remove leagues inside their group
  * Trigger promotion/relegation
  * Run drafts
  * Edit scoring settings (once that exists)
  * Manage invitations

**League Commissioner Permissions**
* Invite/remove teams
* Start/end draft
* Approve trades (post-MVP)
* Move players administratively
* Run week progression and scoring simulations
* Preview and confirm promotion dry-runs

(Commissioners are "game hosts" more than system admins.)

### Post-MVP Features (Explicitly Deferred)

* Live data sync from sports providers
* Auction drafts
* Custom scoring settings engine
* Push notifications
* Trade workflows
* Keeper leagues
* UI/animation polish
* Analytics & public release systems

---

## Testing Philosophy (Built-In From Day One)

### Environment Strategy

* `dev`: local testing and dummy data
* `staging`: full QA environment for automated testing and manual runs
* `prod`: live user environment

### Impersonation & Debugging

* Admin users can impersonate test accounts or league participants
* Visual indicators are shown in UI when impersonation is active
* All impersonated actions are logged

### Dry Run Support

Major operations such as:

* running a promotion cycle
* generating matchups
* applying bulk scoring

can be executed in **“dry run mode”** to preview results before committing database writes.

---

## Technology Stack

| Layer      | Tech                                                |
| ---------- | --------------------------------------------------- |
| Backend    | Supabase (Postgres, Edge Functions, Auth, Realtime) |
| Web        | Next.js, TypeScript, React Query, Tailwind          |
| iOS Mobile | Native SwiftUI                                      |
| Hosting    | Vercel (Web), TestFlight / App Store (Mobile)       |
| Tools      | Cursor, GitHub, ChatGPT                             |

---

## Development Workflow

### Tools & Process

Development is done primarily using:

* Cursor for assisted coding
* GitHub for version control and CI linkages
* Supabase migrations and Edge Functions
* Vercel Preview deployments for QA workflows

Testing includes:

* Automated test scripts
* User simulation via impersonation
* Visual review through mock data seeds

---

## Repository Layout

```
/web               -> Next.js application (Phase 0-1 complete)
/ios               -> Native SwiftUI app (placeholder - Phase 6)
/supabase          -> migrations, functions, seed scripts
/docs              -> design artifacts, diagrams, specs
/assets            -> image files and generated icons
```

**Current Status:**
- ✅ Phase 0/1 scaffolding complete
- ✅ Next.js app initialized with TypeScript, TailwindCSS
- ✅ Supabase client configuration (server & client)
- ✅ Authentication flows (login/signup)
- ✅ Protected routes via middleware
- ✅ Dashboard shell
- ✅ Environment awareness and feature flags
- ✅ Impersonation hook placeholder
- ✅ Supabase migrations (users table)
- ✅ Edge function stub (run_promotion)

---

## Visual Identity

All visual artifacts (logos, icons, league badges, UI illustration assets, app store graphics, etc.) are being developed iteratively.
They will be generated and updated here as the platform evolves.

---

## Status

This project is **in active development**.

The prior project at `github.com/AugieDoggie2021/FantasyFootball` serves as conceptual reference, but this repository represents a ground-up rebuild using modern architecture and design patterns.

---

## Roadmap

1. Supabase schema setup and migrations
2. Auth + user state flows
3. League and promotion group creation
4. Drafting + roster management
5. Matchups, scoring, and standings
6. Promotion and relegation engine
7. SwiftUI app build out
8. Polishing, testing harnesses, notifications, and UX refinements

---

## Contribution

This is currently a private development effort but is structured for future modularity, testing, and potential open-source components.

---

## License

License will be applied once external contribution and publishing considerations are finalized.

