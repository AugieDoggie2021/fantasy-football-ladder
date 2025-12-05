# Fantasy Football Ladder — Roadmap & Feature Inventory

This document tracks current priorities, upcoming milestones, and future feature concepts.

It evolves alongside development and acts as both **Roadmap** and **Feature Inventory**.

---

## Core Phases

### **Phase 0 — Foundations**

*Objective: Standing architecture, empty shell runs end-to-end.*

* Repo structure created (`web`, `ios`, `supabase`, `docs`, `assets`)

* Vercel environment configured

* Supabase project created

* Auth keys + env variables wired to Vercel and local dev

* SwiftUI project initialized with placeholder views

* Empty landing pages render on web + mobile

---

### **Phase 1 — Authentication & Identity**

* Email/password auth

* OAuth support (Google/Apple optional)

* User profile table + first-login provisioning

* Basic role model: user, admin

* Login/logout UI flows (web + mobile)

---

### **Phase 2 — Seasons, Leagues & Promotion Groups**

* Schema for seasons, promotion groups, leagues, teams

* Create season UI (admin)

* Create league UI

* Join league → team onboarding flow

* League dashboard shell

* Promotion group overview / ladder view

---

### **Phase 3 — Players & Rosters**

* Seed NFL players table (initial static dataset)

* Roster model (slots, starter/bench)

* Team roster UI

* Waiver/transaction basics (manual assign first pass)

* Draft prototype (admin/manual control)

---

### **Phase 4 — Matchups & Scoring Engine**

* Matchup table + schedule generation

* Weekly scoring API

* Standings table (wins/losses/points-for/points-against)

* Matchup view UI

* Standings view UI

---

### **Phase 5 — Promotion / Relegation**

* Promotion logic edge function

* Ladder movement rules

* Dry-run preview UI

* Apply results + generate next season

* Promotion history view

---

### **Phase 6 — iOS App Functionality Build-out (SwiftUI)**

* Persistent auth + token storage (Keychain)

* Remote data fetch synchronizing with web API layer

* My Team view

* Matchup view

* Standings view

* Navigation / UX polish to native standards

---

### **Phase 7 — Testing Framework & Admin Toolkit**

*Built intentionally early, expanded repeatedly here.*

* Test user seeding functions

* Impersonation mode + banner indicators

* Dry run features for seasonal operations

* Ability to overwrite "current week" in dev/staging

* Feature flags / experimental toggles

* Audit logs for admin activity

---

### **Phase 8 — Visual Design & Interaction Polish**

* Branding system applied

* Asset packs integrated (league badges, icons, player chips, etc.)

* Empty-state illustrations

* Responsive layout refinements

* Animation for ladder movements or draft events

---

### **Phase 9 — Notifications & Engagement Layer**

* Email notifications (league invite, score update, promotion event)

* Optional push notifications for iOS

* League banners for special events or playoffs

---

### **Phase 10 — Season Lifecycle Management**

* Draft UI up-leveling (timer, auto pick logic, realtime updates)

* Waiver processing rules (FAB / priority)

* Trade inbox & approval flows

* Playoffs format customization

---

### **Phase 11 — Public Release Hardening**

* Error handling & global messaging

* Analytics hooks

* Observability dashboards

* Load testing scenarios

* Security review / RLS validation

* App Store/TestFlight distribution

---

## Future Feature Inventory

*(Brain dump of future ideas to evaluate, prototype, or shelve until later.)*

#### Gameplay Enhancements

* Trading marketplace UX

* FAB system with priority resolution

* Blind bid waivers

* Trade veto governance (commissioner vs owner vote)

* Keeper rules (carryover players)

#### Mobile Innovations

* Live score tiles on Lock Screen

* Widgets

* Siri intents / voice shortcuts

#### Draft Room Upgrades

* Realtime chat

* Draftboard visualization

* Offline draft sync

#### League Mechanics

* Custom scoring presets

* Co-owners / shared GM access

* League branding upload tool

* League newsfeed + commissioner announcements

* Commissioner weekly video recaps — Upload short talking-head style videos from mobile devices (ESPN-style recaps). Videos auto-play when managers log in, featuring weekly highlights, matchup results, and league chat moments

#### Social Layer

* Shareable "promotion cards" for social media

* League invite links

* Team highlight reels (auto-generated recap of the week)

#### AI-Assisted Features

* Trade evaluator suggestions

* Lineup optimization hints

* Personalized matchup projections

* League parity heatmaps

* Season prediction engine

#### Platform Foundation

* Public API for third-party integrations

* Multi-sport expansion template

  *(…but football-only is the focus for now)*

#### Monetization / Editions (Optional Exploration)

* Premium ladder tiers

* Vanity badges

* Advanced analytics pack

#### Ops & Admin Tools

* Replay engine for simulating seasons

* Debug UI showing data model state

* End-to-end impersonation from iOS device

* State rewriter for QA workflows

---

## Guiding Principles

1. **Native Feel** — Mobile app polish matters. SwiftUI is not a wrapper; it is its own product.

2. **Test First** — Impersonation, dry runs, season sandboxing exist early in development.

3. **Modular & Observable** — Every major logic block is a Supabase function or BFF endpoint with logging.

4. **Ladder as First-Class Concept** — Promotion/relegation is not a bolt-on—it shapes the design.

---

## Status Tracking

> Update milestone completion here as features ship.

* [ ] Phase 0 — Foundations

* [ ] Phase 1 — Authentication

* [ ] Phase 2 — Seasons & Leagues

* [ ] Phase 3 — Rosters

* [ ] Phase 4 — Scoring

* [ ] Phase 5 — Promotion Engine

* [ ] Phase 6 — iOS Feature Parity

* [ ] Phase 7 — Testing / Admin Tools

* [ ] Phase 8 — Design Polish

* [ ] Phase 9 — Notifications

* [ ] Phase 10 — Season Lifecycle

* [ ] Phase 11 — Release
