import Foundation

protocol InviteService {
    func sendInvite(to email: String, leagueId: String) async throws
    func getInvites(leagueId: String, pagination: PaginationParams?) async throws -> [Invite]
}


