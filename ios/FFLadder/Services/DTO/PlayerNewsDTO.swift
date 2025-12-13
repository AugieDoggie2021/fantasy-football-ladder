import Foundation

struct PlayerNewsDTO: Codable {
    let id: String
    let player_id: String
    let title: String
    let content: String?
    let source: String?
    let published_at: String
    let injury_related: Bool?
    
    enum CodingKeys: String, CodingKey {
        case id
        case player_id
        case title
        case content
        case source
        case published_at
        case injury_related
    }
}

