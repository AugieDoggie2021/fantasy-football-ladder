import Foundation

struct Team: Identifiable, Codable, Equatable {
    let id: String
    let leagueId: String
    let userId: String
    let lineup: [String]
    let bench: [String]
}


