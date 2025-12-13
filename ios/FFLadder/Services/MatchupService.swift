import Foundation

protocol MatchupService {
    func getMatchup(leagueId: String, week: Int, teamId: String) async throws -> Matchup
}


