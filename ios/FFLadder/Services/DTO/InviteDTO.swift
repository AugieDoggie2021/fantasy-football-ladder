import Foundation

struct InviteDTO: Codable {
    let id: String
    let league_id: String
    let email: String
    let status: String
    let created_at: String?
    let expires_at: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case league_id
        case email
        case status
        case created_at
        case expires_at
    }
}

