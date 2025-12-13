import Foundation

struct MatchupDTO: Codable {
    let id: String
    let league_id: String
    let week: Int
    let team_id: String
    let opponent_team_id: String
    let score: Double?
    let opponent_score: Double?
    let projected_score: Double?
    let opponent_projected_score: Double?
    let live: Bool?
    
    enum CodingKeys: String, CodingKey {
        case id
        case league_id
        case week
        case team_id
        case opponent_team_id
        case score
        case opponent_score
        case projected_score
        case opponent_projected_score
        case live
    }
}

