import SwiftUI

struct TeamView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var services: ServiceContainer
    @StateObject private var vm = TeamViewModel()
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Team")
                    .font(Theme.titleFont())
                    .foregroundColor(Theme.textPrimary)
                
                CardView {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Lineup")
                            .font(Theme.headingFont())
                            .foregroundColor(Theme.textPrimary)
                        ForEach(lineupSlots(), id: \.self) { slot in
                            HStack {
                                Text(slot)
                                    .font(Theme.bodyFont().weight(.semibold))
                                Spacer()
                                Button("Select") {
                                    vm.showPlayerSelector = true
                                    vm.hasUnsavedChanges = true
                                }
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(Theme.surface)
                                .foregroundColor(.white)
                                .cornerRadius(8)
                            }
                            .foregroundColor(Theme.textPrimary)
                        }
                        
                        if vm.hasUnsavedChanges {
                            Button {
                                Task { await vm.setLineup(playerIds: vm.team?.lineup ?? []) }
                            } label: {
                                Text("Save Lineup")
                                    .bold()
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Theme.accent)
                                    .foregroundColor(.white)
                                    .cornerRadius(12)
                            }
                        }
                    }
                }
                
                CardView {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Bench")
                            .font(Theme.headingFont())
                            .foregroundColor(Theme.textPrimary)
                        ForEach(0..<6, id: \.self) { idx in
                            Text("Bench Slot \(idx + 1)")
                                .foregroundColor(Theme.textSecondary)
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
            vm.teamService = services.teamService
            await vm.loadTeam()
        }
        .sheet(isPresented: $vm.showPlayerSelector) {
            Text("Player Selector (Placeholder)")
                .font(Theme.headingFont())
                .padding()
        }
        .refreshable {
            await vm.loadTeam()
        }
        .overlay {
            if vm.isLoading {
                ProgressView().progressViewStyle(.circular)
            } else if vm.team == nil {
                Text("No team found").foregroundColor(Theme.textSecondary)
            }
        }
    }
    
    private func lineupSlots() -> [String] {
        ["QB", "RB", "RB", "WR", "WR", "TE", "FLEX", "DEF"]
    }
}


