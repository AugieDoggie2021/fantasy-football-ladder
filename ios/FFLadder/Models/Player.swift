import Foundation

struct Player: Identifiable, Codable, Equatable {
    let id: String
    let name: String
    let position: String
    let team: String
    let injuryStatus: String?
    let gameStatus: String?
    let byeWeek: Int?
    let newsCount: Int?
    
    enum CodingKeys: String, CodingKey {
        case id, name, position, team
        case injuryStatus = "injury_status"
        case gameStatus = "game_status"
        case byeWeek = "bye_week"
        case newsCount = "news_count"
    }
    
    var hasInjury: Bool {
        guard let status = injuryStatus?.uppercased() else { return false }
        return status == "OUT" || status == "IR" || status == "Q" || status == "D"
    }
    
    var isOnBye: Bool {
        guard let bye = byeWeek else { return false }
        // TODO: Get current week from league
        return false // Placeholder
    }
    
    var hasNews: Bool {
        (newsCount ?? 0) > 0
    }
}


