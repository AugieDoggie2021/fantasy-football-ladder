import Foundation

enum MatchupMapper {
    static func toDomain(_ dto: MatchupDTO) -> Matchup {
        Matchup(
            id: dto.id,
            leagueId: dto.league_id,
            week: dto.week,
            teamId: dto.team_id,
            opponentTeamId: dto.opponent_team_id,
            score: dto.score ?? 0.0,
            opponentScore: dto.opponent_score ?? 0.0,
            projectedScore: dto.projected_score ?? 0.0,
            opponentProjectedScore: dto.opponent_projected_score ?? 0.0,
            live: dto.live ?? false
        )
    }
    
    static func toDomain(_ dtos: [MatchupDTO]) -> [Matchup] {
        dtos.map(toDomain)
    }
}

