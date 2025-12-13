import Foundation

struct PlayerNews: Identifiable, Codable, Equatable {
    let id: String
    let playerId: String
    let title: String
    let content: String?
    let source: String?
    let publishedAt: Date
    let injuryRelated: Bool
}

