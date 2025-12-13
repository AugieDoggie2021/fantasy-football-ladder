import XCTest
@testable import FFLadder

final class FFLadderTests: XCTestCase {
    func testMockLeagueServiceReturnsLeagues() async throws {
        let svc = MockLeagueService()
        let leagues = try await svc.getLeaguesForUser(userId: "u1")
        XCTAssertFalse(leagues.isEmpty)
    }
}




