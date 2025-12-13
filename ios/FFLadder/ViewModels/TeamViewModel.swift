import Foundation

@MainActor
final class TeamViewModel: ObservableObject {
    @Published var team: Team? = nil
    @Published var isLoading: Bool = false
    @Published var showPlayerSelector: Bool = false
    @Published var errorMessage: String? = nil
    @Published var hasUnsavedChanges: Bool = false
    
    var teamService: TeamService?
    var appState: AppState?
    
    func loadTeam() async {
        guard let leagueId = appState?.selectedLeague?.id, let userId = appState?.currentUser?.id else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            team = try await teamService?.getTeam(leagueId: leagueId, userId: userId)
        } catch {
            errorMessage = "Failed to load team."
        }
    }
    
    func setLineup(playerIds: [String]) async {
        guard let leagueId = appState?.selectedLeague?.id, let teamId = team?.id else { return }
        guard isValidLineup(playerIds: playerIds) else {
            errorMessage = "Invalid lineup. Check required positions."
            return
        }
        do {
            try await teamService?.setLineup(leagueId: leagueId, teamId: teamId, playerIds: playerIds)
            await loadTeam()
            hasUnsavedChanges = false
        } catch {
            errorMessage = "Failed to set lineup."
        }
    }
    
    func isValidLineup(playerIds: [String]) -> Bool {
        // Minimal validation placeholder: ensure at least 8 starters
        return playerIds.count >= 8
    }
}


