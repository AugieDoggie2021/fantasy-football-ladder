import Foundation

struct LeagueDTO: Codable {
    let id: String
    let name: String
    let code: String
    let created_at: String?
    let updated_at: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case code
        case created_at
        case updated_at
    }
}

