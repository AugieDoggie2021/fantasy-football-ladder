import Foundation

struct Watchlist: Identifiable, Codable, Equatable {
    let id: String
    let userId: String
    let playerIds: [String]
}

