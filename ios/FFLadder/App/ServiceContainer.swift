import Foundation

final class ServiceContainer: ObservableObject {
    let authService: AuthService
    let leagueService: LeagueService
    let teamService: TeamService
    let matchupService: MatchupService
    let playerService: PlayerService
    let draftKitService: DraftKitService
    let inviteService: InviteService
    let playerNewsService: PlayerNewsService
    let watchlistService: WatchlistService
    
    weak var appState: AppState?
    
    init(
        authService: AuthService,
        leagueService: LeagueService,
        teamService: TeamService,
        matchupService: MatchupService,
        playerService: PlayerService,
        draftKitService: DraftKitService,
        inviteService: InviteService,
        playerNewsService: PlayerNewsService,
        watchlistService: WatchlistService
    ) {
        self.authService = authService
        self.leagueService = leagueService
        self.teamService = teamService
        self.matchupService = matchupService
        self.playerService = playerService
        self.draftKitService = draftKitService
        self.inviteService = inviteService
        self.playerNewsService = playerNewsService
        self.watchlistService = watchlistService
    }
    
    static func `default`() -> ServiceContainer {
        #if canImport(Supabase)
        return ServiceContainer(
            authService: SupabaseAuthService(),
            leagueService: SupabaseLeagueService(),
            teamService: SupabaseTeamService(),
            matchupService: SupabaseMatchupService(),
            playerService: SupabasePlayerService(),
            draftKitService: SupabaseDraftKitService(),
            inviteService: SupabaseInviteService(),
            playerNewsService: SupabasePlayerNewsService(),
            watchlistService: SupabaseWatchlistService()
        )
        #else
        return ServiceContainer(
            authService: MockAuthService(),
            leagueService: MockLeagueService(),
            teamService: MockTeamService(),
            matchupService: MockMatchupService(),
            playerService: MockPlayerService(),
            draftKitService: MockDraftKitService(),
            inviteService: MockInviteService(),
            playerNewsService: MockPlayerNewsService(),
            watchlistService: MockWatchlistService()
        )
        #endif
    }
}

// Mock services for development
final class MockPlayerNewsService: PlayerNewsService {
    func getNews(for playerId: String) async throws -> [PlayerNews] { [] }
    func getRecentNews(limit: Int) async throws -> [PlayerNews] { [] }
}

final class MockWatchlistService: WatchlistService {
    func getWatchlist(userId: String) async throws -> Watchlist {
        Watchlist(id: "1", userId: userId, playerIds: [])
    }
    func addPlayer(userId: String, playerId: String) async throws {}
    func removePlayer(userId: String, playerId: String) async throws {}
    func isWatched(userId: String, playerId: String) async throws -> Bool { false }
}




