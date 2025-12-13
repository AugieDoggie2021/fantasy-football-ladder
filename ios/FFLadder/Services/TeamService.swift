import Foundation

protocol TeamService {
    func getTeam(leagueId: String, userId: String) async throws -> Team
    func setLineup(leagueId: String, teamId: String, playerIds: [String]) async throws
}


