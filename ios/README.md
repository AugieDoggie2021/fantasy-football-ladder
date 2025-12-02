# Fantasy Football Ladder - iOS App

## SwiftUI Application Stub

This directory contains the basic SwiftUI app scaffolding for the Fantasy Football Ladder iOS application.

## Current Status: Stub Implementation

The app currently includes:
- ✅ Basic app structure with SwiftUI
- ✅ Authentication screen (UI only, Supabase integration pending)
- ✅ Dashboard view with "My Leagues" list stub
- ✅ Navigation structure
- ✅ Basic data models

## Setup Instructions

### Prerequisites
- Xcode 14.0 or later
- iOS 16.0+ deployment target
- CocoaPods or Swift Package Manager (for Supabase SDK when integrated)

### To Open in Xcode:

1. Create a new Xcode project:
   ```bash
   cd ios
   # Create new Xcode project: File > New > Project > iOS > App
   # Name: FantasyFootballLadder
   # Interface: SwiftUI
   # Language: Swift
   ```

2. Add the files from this directory to your Xcode project:
   - `FantasyFootballLadderApp.swift` (replace default App file)
   - `Views/` folder contents
   - `Services/AuthManager.swift`
   - `Models/League.swift`

3. Install Supabase Swift SDK (when ready):
   ```bash
   # Using Swift Package Manager (recommended)
   # Add package: https://github.com/supabase/supabase-swift
   ```

4. Configure environment:
   - Add `Config.plist` or `.xcconfig` file with:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`

## Next Steps (Post-Stub)

1. **Integrate Supabase Swift Client**
   - Add Supabase Swift SDK dependency
   - Update `AuthManager` to use real Supabase auth
   - Implement session persistence with Keychain

2. **Build API Service Layer**
   - Create `SupabaseService` for data fetching
   - Implement league, team, matchup endpoints
   - Add error handling and loading states

3. **Complete Views**
   - Implement league detail view
   - Add team roster view
   - Create matchup view
   - Build standings view

4. **Navigation & UX**
   - Implement deep linking
   - Add pull-to-refresh
   - Create loading and error states
   - Polish animations and transitions

## Project Structure

```
ios/
  └── FantasyFootballLadder/
      ├── FantasyFootballLadderApp.swift    # App entry point
      ├── Views/
      │   ├── LoginView.swift               # Authentication screen
      │   ├── DashboardView.swift           # Main leagues list
      │   └── LeagueDetailView.swift        # League detail (stub)
      ├── Services/
      │   └── AuthManager.swift             # Auth state management
      └── Models/
          └── League.swift                  # Data models
```

## Notes

- This is a minimal stub to enable Xcode project compilation
- Authentication UI is complete but uses placeholder logic
- Supabase integration is the next major milestone
- All data fetching is currently stubbed
