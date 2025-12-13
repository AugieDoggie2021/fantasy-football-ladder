import Foundation
import Combine

@MainActor
final class PlayersViewModel: ObservableObject {
    @Published var query: String = ""
    @Published var players: [Player] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String? = nil
    @Published var positionFilter: String? = nil
    
    var playerService: PlayerService?
    var draftKitService: DraftKitService?
    var appState: AppState?
    
    private var cancellables: Set<AnyCancellable> = []
    
    init() {
        // Debounce search input
        $query
            .removeDuplicates()
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .sink { [weak self] _ in
                Task { await self?.search() }
            }
            .store(in: &cancellables)
    }
    
    func search() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let pagination = PaginationParams(page: 0, pageSize: 50)
            var results = try await playerService?.searchPlayers(query: query, pagination: pagination) ?? []
            if let position = positionFilter {
                results = results.filter { $0.position == position }
            }
            players = results
        } catch {
            errorMessage = "Search failed."
        }
    }
    
    func loadPlayers() async {
        guard let appState, let leagueId = appState.selectedLeague?.id else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            // Use cache if valid (5 min TTL)
            if let cache = appState.playersCache,
               let expiry = appState.playersCacheExpiry,
               expiry > Date() {
                players = cache
                return
            }
            let pagination = PaginationParams(page: 0, pageSize: 500)
            let fetched = try await playerService?.getPlayers(for: leagueId, pagination: pagination) ?? []
            players = fetched
            appState.playersCache = fetched
            appState.playersCacheExpiry = Date().addingTimeInterval(5 * 60)
        } catch {
            errorMessage = "Failed to load players."
        }
    }
}


