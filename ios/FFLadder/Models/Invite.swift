import Foundation

struct Invite: Identifiable, Codable, Equatable {
    let id: String
    let leagueId: String
    let email: String
    let status: String
    
    init(id: String, leagueId: String, email: String, status: String) {
        self.id = id
        self.leagueId = leagueId
        self.email = email
        self.status = status
    }
}


