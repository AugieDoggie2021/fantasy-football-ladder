import Foundation

protocol LeagueService {
    func getLeaguesForUser(userId: String) async throws -> [League]
    func createLeague(name: String) async throws -> League
    func joinLeague(code: String) async throws -> League
}


