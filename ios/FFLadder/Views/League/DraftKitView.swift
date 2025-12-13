import SwiftUI

struct DraftKitView: View {
    @StateObject private var vm = DraftKitViewModel()
    @State private var position: String? = nil
    @State private var selected: DraftRank? = nil
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Position filters
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(["ALL","QB","RB","WR","TE","DEF"], id: \.self) { pos in
                        Button {
                            position = pos == "ALL" ? nil : pos
                            vm.positionFilter = position
                            Task { await vm.loadRankings() }
                        } label: {
                            Pill(text: pos)
                        }
                    }
                }
                .padding(.horizontal, 16)
            }
            
            List {
                ForEach(vm.rankings) { rank in
                    Button {
                        selected = rank
                    } label: {
                        HStack {
                            Text("#\(rank.rank)")
                                .frame(width: 48, alignment: .leading)
                            VStack(alignment: .leading) {
                                Text("Player \(rank.playerId)")
                                    .font(Theme.bodyFont().weight(.semibold))
                                Text("Pos Rank: \(rank.positionRank)")
                                    .font(Theme.captionFont())
                                    .foregroundColor(Theme.textSecondary)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundColor(Theme.textSecondary)
                        }
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .listRowBackground(Theme.surface)
                    .foregroundColor(Theme.textPrimary)
                }
            }
            .listStyle(.plain)
        }
        .background(
            LinearGradient(colors: [Theme.gradientStart, Theme.gradientEnd], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
        )
        .task {
            await vm.loadRankings()
        }
        .refreshable {
            await vm.loadRankings()
        }
        .sheet(item: $selected) { item in
            VStack(alignment: .leading, spacing: 12) {
                Text("Player Detail")
                    .font(Theme.titleFont())
                    .foregroundColor(Theme.textPrimary)
                Text("Player ID: \(item.playerId)")
                    .foregroundColor(Theme.textSecondary)
                Text("Overall Rank: #\(item.rank)")
                    .foregroundColor(Theme.textSecondary)
                Text("Position Rank: #\(item.positionRank)")
                    .foregroundColor(Theme.textSecondary)
                Spacer()
            }
            .padding(20)
            .background(Theme.surface)
        }
    }
}


