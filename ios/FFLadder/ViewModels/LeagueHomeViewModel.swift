import Foundation

@MainActor
final class LeagueHomeViewModel: ObservableObject {
    @Published var invites: [Invite] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String? = nil
    
    var inviteService: InviteService?
    var appState: AppState?
    
    func loadInvites() async {
        guard let leagueId = appState?.selectedLeague?.id else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            let pagination = PaginationParams(page: 0, pageSize: 100)
            invites = try await inviteService?.getInvites(leagueId: leagueId, pagination: pagination) ?? []
        } catch {
            errorMessage = "Failed to load invites."
        }
    }
    
    func sendInvite(email: String) async {
        guard let leagueId = appState?.selectedLeague?.id else { return }
        do {
            try await inviteService?.sendInvite(to: email, leagueId: leagueId)
            await loadInvites()
        } catch {
            errorMessage = "Failed to send invite."
        }
    }
}


