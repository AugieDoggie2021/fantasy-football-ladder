import Foundation

struct TeamDTO: Codable {
    let id: String
    let league_id: String
    let user_id: String
    let lineup: [String]?
    let bench: [String]?
    
    enum CodingKeys: String, CodingKey {
        case id
        case league_id
        case user_id
        case lineup
        case bench
    }
}

