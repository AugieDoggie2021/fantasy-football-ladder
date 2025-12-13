import XCTest
@testable import FFLadder

final class MapperTests: XCTestCase {
    
    func testLeagueMapper() {
        let dto = LeagueDTO(
            id: "league-1",
            name: "Test League",
            code: "ABCD",
            created_at: nil,
            updated_at: nil
        )
        
        let league = LeagueMapper.toDomain(dto)
        
        XCTAssertEqual(league.id, "league-1")
        XCTAssertEqual(league.name, "Test League")
        XCTAssertEqual(league.code, "ABCD")
    }
    
    func testPlayerMapper() {
        let dto = PlayerDTO(
            id: "player-1",
            name: "John Doe",
            position: "QB",
            team: "NYG",
            injury_status: "Q",
            game_status: "ACTIVE",
            bye_week: 9,
            news_count: 2
        )
        
        let player = PlayerMapper.toDomain(dto)
        
        XCTAssertEqual(player.id, "player-1")
        XCTAssertEqual(player.name, "John Doe")
        XCTAssertEqual(player.position, "QB")
        XCTAssertEqual(player.team, "NYG")
        XCTAssertEqual(player.injuryStatus, "Q")
        XCTAssertTrue(player.hasInjury)
        XCTAssertEqual(player.byeWeek, 9)
        XCTAssertEqual(player.newsCount, 2)
        XCTAssertTrue(player.hasNews)
    }
    
    func testMatchupMapper() {
        let dto = MatchupDTO(
            id: "matchup-1",
            league_id: "league-1",
            week: 1,
            team_id: "team-1",
            opponent_team_id: "team-2",
            score: 120.5,
            opponent_score: 98.3,
            projected_score: 125.0,
            opponent_projected_score: 105.0,
            live: true
        )
        
        let matchup = MatchupMapper.toDomain(dto)
        
        XCTAssertEqual(matchup.id, "matchup-1")
        XCTAssertEqual(matchup.leagueId, "league-1")
        XCTAssertEqual(matchup.week, 1)
        XCTAssertEqual(matchup.score, 120.5)
        XCTAssertEqual(matchup.opponentScore, 98.3)
        XCTAssertEqual(matchup.projectedScore, 125.0)
        XCTAssertTrue(matchup.live)
    }
    
    func testTeamMapper() {
        let dto = TeamDTO(
            id: "team-1",
            league_id: "league-1",
            user_id: "user-1",
            lineup: ["player-1", "player-2"],
            bench: ["player-3"]
        )
        
        let team = TeamMapper.toDomain(dto)
        
        XCTAssertEqual(team.id, "team-1")
        XCTAssertEqual(team.leagueId, "league-1")
        XCTAssertEqual(team.userId, "user-1")
        XCTAssertEqual(team.lineup.count, 2)
        XCTAssertEqual(team.bench.count, 1)
    }
    
    func testTeamMapperWithNilArrays() {
        let dto = TeamDTO(
            id: "team-1",
            league_id: "league-1",
            user_id: "user-1",
            lineup: nil,
            bench: nil
        )
        
        let team = TeamMapper.toDomain(dto)
        
        XCTAssertEqual(team.lineup.count, 0)
        XCTAssertEqual(team.bench.count, 0)
    }
}

