import Foundation

struct DraftRank: Identifiable, Codable, Equatable {
    let id: String
    let playerId: String
    let rank: Int
    let positionRank: Int
}


