import SwiftUI

struct AppRouter: View {
    @EnvironmentObject private var appState: AppState
    
    var body: some View {
        Group {
            if appState.currentUser == nil {
                SplashView()
            } else if let inviteToken = appState.pendingInviteToken {
                JoinInviteView(token: inviteToken)
            } else if let _ = appState.selectedLeague {
                LeagueContainerView()
            } else {
                DashboardView()
            }
        }
    }
}


