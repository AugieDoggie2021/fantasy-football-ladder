import SwiftUI

struct MatchupView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var services: ServiceContainer
    @StateObject private var vm = MatchupViewModel()
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text("Matchup")
                        .font(Theme.titleFont())
                        .foregroundColor(Theme.textPrimary)
                    Spacer()
                    if vm.matchup?.live == true {
                        LivePill()
                    }
                }
                
                CardView {
                    VStack(spacing: 12) {
                        // Two helmets placeholder
                        HStack {
                            Circle().fill(Theme.accent).frame(width: 48, height: 48)
                            Spacer()
                            Circle().fill(Theme.surface).frame(width: 48, height: 48)
                        }
                        .padding(.horizontal, 16)
                        
                        HStack {
                            VStack {
                                Text("\(Int(vm.matchup?.score ?? 0))")
                                    .font(.system(size: 32, weight: .bold))
                                    .foregroundColor(Theme.textPrimary)
                                Text("Proj: \(Int(vm.matchup?.projectedScore ?? 0))")
                                    .font(Theme.captionFont())
                                    .foregroundColor(Theme.textSecondary)
                            }
                            Spacer()
                            VStack {
                                Text("\(Int(vm.matchup?.opponentScore ?? 0))")
                                    .font(.system(size: 32, weight: .bold))
                                    .foregroundColor(Theme.textPrimary)
                                Text("Proj: \(Int(vm.matchup?.opponentProjectedScore ?? 0))")
                                    .font(Theme.captionFont())
                                    .foregroundColor(Theme.textSecondary)
                            }
                        }
                        
                        if let ts = vm.lastUpdated {
                            Text("Updated \(ts.formatted(date: .omitted, time: .shortened))")
                                .font(Theme.captionFont())
                                .foregroundColor(Theme.textSecondary)
                        }
                    }
                }
                
                // Win Probability
                CardView {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Win Probability")
                            .font(Theme.headingFont())
                            .foregroundColor(Theme.textPrimary)
                        
                        HStack {
                            Text("\(Int(vm.winProbability * 100))%")
                                .font(.system(size: 48, weight: .bold))
                                .foregroundColor(Theme.accent)
                            
                            Spacer()
                            
                            // Mini sparkline
                            if !vm.probabilityHistory.isEmpty {
                                SparklineView(data: vm.probabilityHistory)
                                    .frame(width: 100, height: 40)
                            }
                        }
                        
                        // Probability bar
                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                Rectangle()
                                    .fill(Theme.surfaceElevated)
                                    .frame(height: 8)
                                    .cornerRadius(4)
                                
                                Rectangle()
                                    .fill(
                                        LinearGradient(
                                            colors: [Theme.accent, Theme.accent.opacity(0.6)],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                    .frame(width: geometry.size.width * CGFloat(vm.winProbability), height: 8)
                                    .cornerRadius(4)
                            }
                        }
                        .frame(height: 8)
                    }
                }
                
                CardView {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Position-by-Position (Placeholder)")
                            .font(Theme.headingFont())
                            .foregroundColor(Theme.textPrimary)
                        ForEach(["QB","RB","WR","TE","FLEX","DEF"], id: \.self) { pos in
                            HStack {
                                Text(pos)
                                Spacer()
                                Text("-- vs --")
                            }
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
            vm.matchupService = services.matchupService
            await vm.loadMatchup()
            vm.startLiveUpdates()
        }
        .onDisappear {
            vm.stopLiveUpdates()
        }
        .refreshable {
            await vm.loadMatchup()
        }
        .overlay {
            if vm.isLoading {
                ProgressView().progressViewStyle(.circular)
            } else if vm.matchup == nil {
                Text("No matchup available").foregroundColor(Theme.textSecondary)
            }
        }
    }
}


