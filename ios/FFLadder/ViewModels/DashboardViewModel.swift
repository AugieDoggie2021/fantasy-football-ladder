import Foundation

@MainActor
final class DashboardViewModel: ObservableObject {
    @Published var leagues: [League] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String? = nil
    
    var leagueService: LeagueService?
    var appState: AppState?
    
    func loadLeagues() async {
        guard let userId = appState?.currentUser?.id else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            let result = try await leagueService?.getLeaguesForUser(userId: userId) ?? []
            leagues = result
            appState?.userLeagues = result
        } catch {
            errorMessage = "Failed to load leagues."
        }
    }
    
    func createLeagueTapped() {
        // Placeholder: Route to create league flow (Phase 2/3)
    }
    
    func joinLeagueTapped() {
        // Placeholder: Route to join league flow (Phase 2/3)
    }
}


