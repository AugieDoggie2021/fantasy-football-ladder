import Foundation

struct DraftRankDTO: Codable {
    let id: String
    let player_id: String
    let rank: Int
    let position_rank: Int
    let position: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case player_id
        case rank
        case position_rank
        case position
    }
}

