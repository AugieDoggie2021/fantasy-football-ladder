import SwiftUI

struct SplashView: View {
    @EnvironmentObject private var appState: AppState
    
    var body: some View {
        ZStack {
            LinearGradient(colors: [Theme.gradientStart, Theme.gradientEnd], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
            VStack(spacing: 16) {
                Text("Fantasy Football Ladder")
                    .font(Theme.titleFont())
                    .foregroundColor(Theme.textPrimary)
                Text("Loading...")
                    .font(Theme.bodyFont())
                    .foregroundColor(Theme.textSecondary)
            }
        }
        .task {
            // Placeholder splash delay and simple route decision
            try? await Task.sleep(nanoseconds: 800_000_000)
            if appState.currentUser == nil {
                // Navigate to Login by setting a state that AppRouter observes
                appState.currentUser = nil
            }
        }
        .navigationDestination(isPresented: .constant(appState.currentUser == nil)) {
            LoginView()
        }
    }
}


