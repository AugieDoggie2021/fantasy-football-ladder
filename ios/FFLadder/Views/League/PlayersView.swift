import SwiftUI

struct PlayersView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var services: ServiceContainer
    @StateObject private var vm = PlayersViewModel()
    @StateObject private var draftVM = DraftKitViewModel()
    
    var body: some View {
        VStack(spacing: 8) {
            HStack {
                TextField("Search players", text: $vm.query)
                    .padding(10)
                    .background(Theme.surface)
                    .cornerRadius(8)
                Button("Search") {
                    Task { await vm.search() }
                }
                .padding(10)
                .background(Theme.accent)
                .foregroundColor(.white)
                .cornerRadius(8)
            }
            .padding(.horizontal, 16)
            
            // Filters placeholder
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(["ALL","QB","RB","WR","TE","DEF"], id: \.self) { pos in
                        Button {
                            vm.positionFilter = pos == "ALL" ? nil : pos
                            Task { await vm.search() }
                        } label: {
                            Pill(text: pos)
                        }
                    }
                }
                .padding(.horizontal, 16)
            }
            
            List {
                ForEach(vm.players) { player in
                    NavigationLink(destination: PlayerDetailView(player: player)) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                HStack(spacing: 8) {
                                    Text(player.name)
                                        .font(Theme.bodyFont().weight(.semibold))
                                    
                                    // Injury/Bye badges
                                    if player.hasInjury, let status = player.injuryStatus {
                                        Pill(text: status, style: .error)
                                    }
                                    if player.isOnBye, let bye = player.byeWeek {
                                        Pill(text: "BYE \(bye)", style: .warning)
                                    }
                                    if player.hasNews {
                                        Pill(text: "NEWS", style: .info)
                                    }
                                }
                                
                                Text("\(player.position) • \(player.team)")
                                    .font(Theme.captionFont())
                                    .foregroundColor(Theme.textSecondary)
                            }
                            Spacer()
                            if let rank = draftVM.rankings.first(where: { $0.playerId == player.id }) {
                                Pill(text: "#\(rank.rank)")
                            }
                        }
                    }
                    .listRowBackground(Theme.surface)
                    .foregroundColor(Theme.textPrimary)
                }
            }
            .listStyle(.plain)
            .background(Color.clear)
        }
        .background(
            LinearGradient(colors: [Theme.gradientStart, Theme.gradientEnd], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
        )
        .task {
            vm.appState = appState
            vm.playerService = services.playerService
            draftVM.draftKitService = services.draftKitService
            await draftVM.loadRankings()
            await vm.loadPlayers()
        }
        .refreshable {
            await vm.loadPlayers()
            await draftVM.loadRankings()
        }
        .overlay {
            if vm.isLoading {
                ProgressView().progressViewStyle(.circular)
            } else if vm.players.isEmpty {
                Text("No players").foregroundColor(Theme.textSecondary)
            }
        }
    }
}


