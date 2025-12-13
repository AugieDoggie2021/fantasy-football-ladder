import Foundation

protocol InviteService {
    func sendInvite(to email: String, leagueId: String) async throws -> String? // Returns invite token
    func createInviteLink(leagueId: String) async throws -> String // Returns invite token
    func getInvites(leagueId: String, pagination: PaginationParams?) async throws -> [Invite]
    func getInviteByToken(token: String) async throws -> InviteDetails
    func acceptInvite(token: String, teamName: String) async throws -> AcceptInviteResult
}

struct InviteDetails: Codable {
    let id: String
    let leagueId: String
    let leagueName: String
    let email: String?
    let status: String
    let maxTeams: Int
    let teamCount: Int
}

struct AcceptInviteResult: Codable {
    let leagueId: String
    let teamId: String
}


