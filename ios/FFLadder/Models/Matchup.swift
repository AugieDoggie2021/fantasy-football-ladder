import Foundation

struct Matchup: Identifiable, Codable, Equatable {
    let id: String
    let leagueId: String
    let week: Int
    let teamId: String
    let opponentTeamId: String
    let score: Double
    let opponentScore: Double
    let projectedScore: Double
    let opponentProjectedScore: Double
    let live: Bool
}


