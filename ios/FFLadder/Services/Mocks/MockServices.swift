import Foundation

final class MockLeagueService: LeagueService {
    func getLeaguesForUser(userId: String) async throws -> [League] {
        [League(id: "lg1", name: "Championship A", code: "CHAMP"),
         League(id: "lg2", name: "Division B", code: "DIVB")]
    }
    func createLeague(name: String) async throws -> League {
        League(id: UUID().uuidString, name: name, code: "NEW1")
    }
    func joinLeague(code: String) async throws -> League {
        League(id: UUID().uuidString, name: "Joined \(code)", code: code)
    }
}

final class MockTeamService: TeamService {
    func getTeam(leagueId: String, userId: String) async throws -> Team {
        Team(id: "tm1", leagueId: leagueId, userId: userId, lineup: ["p1","p2","p3","p4","p5","p6","p7","p8"], bench: ["p9","p10","p11","p12","p13","p14"])
    }
    func setLineup(leagueId: String, teamId: String, playerIds: [String]) async throws {}
}

final class MockMatchupService: MatchupService {
    func getMatchup(leagueId: String, week: Int, teamId: String) async throws -> Matchup {
        Matchup(id: "mx1", leagueId: leagueId, week: week, teamId: teamId, opponentTeamId: "opp1", score: 85.4, opponentScore: 80.1, projectedScore: 102.0, opponentProjectedScore: 99.0, live: false)
    }
}

final class MockPlayerService: PlayerService {
    func searchPlayers(query: String) async throws -> [Player] {
        samplePlayers().filter { $0.name.lowercased().contains(query.lowercased()) || query.isEmpty }
    }
    func getPlayers(for leagueId: String) async throws -> [Player] {
        samplePlayers()
    }
    private func samplePlayers() -> [Player] {
        [
            Player(id: "p1", name: "Josh Allen", position: "QB", team: "BUF"),
            Player(id: "p2", name: "Christian McCaffrey", position: "RB", team: "SF"),
            Player(id: "p3", name: "Justin Jefferson", position: "WR", team: "MIN"),
            Player(id: "p4", name: "Travis Kelce", position: "TE", team: "KC"),
            Player(id: "p5", name: "Amon-Ra St. Brown", position: "WR", team: "DET"),
            Player(id: "p6", name: "Nick Chubb", position: "RB", team: "CLE")
        ]
    }
}

final class MockDraftKitService: DraftKitService {
    func getRankings() async throws -> [DraftRank] {
        [
            DraftRank(id: "r1", playerId: "p2", rank: 1, positionRank: 1),
            DraftRank(id: "r2", playerId: "p3", rank: 2, positionRank: 1),
            DraftRank(id: "r3", playerId: "p4", rank: 3, positionRank: 1),
            DraftRank(id: "r4", playerId: "p1", rank: 4, positionRank: 1)
        ]
    }
}

final class MockInviteService: InviteService {
    private var invites: [Invite] = [
        Invite(id: "i1", leagueId: "lg1", email: "friend1@example.com", status: "pending"),
        Invite(id: "i2", leagueId: "lg1", email: "friend2@example.com", status: "accepted")
    ]
    func sendInvite(to email: String, leagueId: String) async throws {
        invites.append(Invite(id: UUID().uuidString, leagueId: leagueId, email: email, status: "pending"))
    }
    func getInvites(leagueId: String) async throws -> [Invite] {
        invites.filter { $0.leagueId == leagueId }
    }
}




