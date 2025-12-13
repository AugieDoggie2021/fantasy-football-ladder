import Foundation

enum TeamMapper {
    static func toDomain(_ dto: TeamDTO) -> Team {
        Team(
            id: dto.id,
            leagueId: dto.league_id,
            userId: dto.user_id,
            lineup: dto.lineup ?? [],
            bench: dto.bench ?? []
        )
    }
    
    static func toDomain(_ dtos: [TeamDTO]) -> [Team] {
        dtos.map(toDomain)
    }
}

