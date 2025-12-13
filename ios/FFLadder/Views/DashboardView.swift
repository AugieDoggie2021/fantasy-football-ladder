import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var services: ServiceContainer
    @StateObject private var vm = DashboardViewModel()
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Overview")
                    .font(Theme.titleFont())
                    .foregroundColor(Theme.textPrimary)
                
                HStack(spacing: 12) {
                    Button {
                        vm.createLeagueTapped()
                    } label: {
                        Text("Create League")
                            .bold()
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Theme.accent)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    }
                    .accessibilityLabel("Create League")
                    
                    Button {
                        vm.joinLeagueTapped()
                    } label: {
                        Text("Join League")
                            .bold()
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Theme.surfaceElevated)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    }
                    .accessibilityLabel("Join League")
                }
                
                Text("Your Leagues")
                    .font(Theme.headingFont())
                    .foregroundColor(Theme.textPrimary)
                
                VStack(spacing: 12) {
                    ForEach(vm.leagues) { league in
                        CardView {
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(league.name)
                                        .font(Theme.bodyFont().weight(.semibold))
                                        .foregroundColor(Theme.textPrimary)
                                    Text("Code: \(league.code)")
                                        .font(Theme.captionFont())
                                        .foregroundColor(Theme.textSecondary)
                                }
                                Spacer()
                                Button {
                                    appState.selectedLeague = league
                                } label: {
                                    Text("Enter")
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 8)
                                        .background(Theme.surface)
                                        .foregroundColor(.white)
                                        .cornerRadius(8)
                                }
                                .accessibilityLabel("Enter \(league.name)")
                            }
                        }
                    }
                }
            }
            .padding(16)
        }
        .background(
            LinearGradient(colors: [Theme.gradientStart, Theme.gradientEnd], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
        )
        .task {
            vm.appState = appState
            vm.leagueService = services.leagueService
            await vm.loadLeagues()
        }
        .refreshable {
            await vm.loadLeagues()
        }
        .overlay {
            if vm.isLoading {
                ProgressView().progressViewStyle(.circular)
            } else if vm.leagues.isEmpty {
                Text("No leagues yet").foregroundColor(Theme.textSecondary)
            }
        }
    }
}


