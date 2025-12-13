import SwiftUI

struct PlayerDetailView: View {
    let player: Player
    @EnvironmentObject private var services: ServiceContainer
    @Environment(\.dismiss) private var dismiss
    @StateObject private var newsVM = PlayerNewsViewModel()
    @State private var isWatched: Bool = false
    @State private var isLoadingWatchlist: Bool = false
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(player.name)
                            .font(Theme.titleFont())
                            .foregroundColor(Theme.textPrimary)
                        
                        HStack(spacing: 12) {
                            Text("\(player.position) • \(player.team)")
                                .font(Theme.bodyFont())
                                .foregroundColor(Theme.textSecondary)
                            
                            // Injury/Bye badges
                            if player.hasInjury, let status = player.injuryStatus {
                                Pill(text: status, style: .error)
                            }
                            if player.isOnBye, let bye = player.byeWeek {
                                Pill(text: "BYE \(bye)", style: .warning)
                            }
                        }
                    }
                    
                    Spacer()
                    
                    // Watchlist toggle
                    Button {
                        Task { await toggleWatchlist() }
                    } label: {
                        Image(systemName: isWatched ? "star.fill" : "star")
                            .foregroundColor(isWatched ? Theme.accent : Theme.textSecondary)
                            .font(.title2)
                    }
                    .disabled(isLoadingWatchlist)
                }
                .padding()
                .background(Theme.surface)
                .cornerRadius(12)
                
                // News Section
                if !newsVM.news.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Recent News")
                            .font(Theme.headingFont())
                            .foregroundColor(Theme.textPrimary)
                        
                        ForEach(newsVM.news.prefix(5)) { newsItem in
                            NewsRow(news: newsItem)
                        }
                    }
                    .padding()
                    .background(Theme.surface)
                    .cornerRadius(12)
                }
                
                // Projections placeholder
                VStack(alignment: .leading, spacing: 12) {
                    Text("Projections")
                        .font(Theme.headingFont())
                        .foregroundColor(Theme.textPrimary)
                    
                    Text("Projected points: TBD")
                        .font(Theme.bodyFont())
                        .foregroundColor(Theme.textSecondary)
                }
                .padding()
                .background(Theme.surface)
                .cornerRadius(12)
            }
            .padding()
        }
        .background(
            LinearGradient(colors: [Theme.gradientStart, Theme.gradientEnd], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
        )
        .navigationBarTitleDisplayMode(.inline)
        .task {
            newsVM.playerNewsService = services.playerNewsService
            await newsVM.loadNews(for: player.id)
            await checkWatchlistStatus()
        }
    }
    
    private func toggleWatchlist() async {
        guard let appState = services.appState,
              let userId = appState.currentUser?.id else { return }
        
        isLoadingWatchlist = true
        defer { isLoadingWatchlist = false }
        
        do {
            if isWatched {
                try await services.watchlistService?.removePlayer(userId: userId, playerId: player.id)
                isWatched = false
                AnalyticsServiceProvider.shared.track(
                    event: AnalyticsEvent.playerUnwatched,
                    parameters: ["player_id": player.id]
                )
            } else {
                try await services.watchlistService?.addPlayer(userId: userId, playerId: player.id)
                isWatched = true
                AnalyticsServiceProvider.shared.track(
                    event: AnalyticsEvent.playerWatched,
                    parameters: ["player_id": player.id]
                )
            }
        } catch {
            // Handle error
        }
    }
    
    private func checkWatchlistStatus() async {
        guard let appState = services.appState,
              let userId = appState.currentUser?.id else { return }
        
        do {
            isWatched = try await services.watchlistService?.isWatched(userId: userId, playerId: player.id) ?? false
        } catch {
            // Handle error
        }
    }
}

struct NewsRow: View {
    let news: PlayerNews
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(news.title)
                .font(Theme.bodyFont().weight(.semibold))
                .foregroundColor(Theme.textPrimary)
            
            if let content = news.content {
                Text(content)
                    .font(Theme.captionFont())
                    .foregroundColor(Theme.textSecondary)
                    .lineLimit(2)
            }
            
            HStack {
                if let source = news.source {
                    Text(source)
                        .font(Theme.captionFont())
                        .foregroundColor(Theme.textSecondary)
                }
                
                Spacer()
                
                Text(news.publishedAt, style: .relative)
                    .font(Theme.captionFont())
                    .foregroundColor(Theme.textSecondary)
            }
        }
        .padding(.vertical, 8)
    }
}

@MainActor
final class PlayerNewsViewModel: ObservableObject {
    @Published var news: [PlayerNews] = []
    @Published var isLoading: Bool = false
    
    var playerNewsService: PlayerNewsService?
    
    func loadNews(for playerId: String) async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            news = try await playerNewsService?.getNews(for: playerId) ?? []
        } catch {
            // Handle error
        }
    }
}

