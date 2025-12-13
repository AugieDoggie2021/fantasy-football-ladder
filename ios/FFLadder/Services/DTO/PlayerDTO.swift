import Foundation

struct PlayerDTO: Codable {
    let id: String
    let name: String
    let position: String
    let team: String
    let injury_status: String?
    let game_status: String?
    let bye_week: Int?
    let news_count: Int?
    
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case position
        case team
        case injury_status
        case game_status
        case bye_week
        case news_count
    }
}

