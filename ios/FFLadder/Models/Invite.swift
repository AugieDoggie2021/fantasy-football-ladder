import Foundation

struct Invite: Identifiable, Codable, Equatable {
    let id: String
    let leagueId: String
    let email: String
    let status: String
}


