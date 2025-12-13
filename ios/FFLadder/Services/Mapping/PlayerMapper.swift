import Foundation

enum PlayerMapper {
    static func toDomain(_ dto: PlayerDTO) -> Player {
        Player(
            id: dto.id,
            name: dto.name,
            position: dto.position,
            team: dto.team,
            injuryStatus: dto.injury_status,
            gameStatus: dto.game_status,
            byeWeek: dto.bye_week,
            newsCount: dto.news_count
        )
    }
    
    static func toDomain(_ dtos: [PlayerDTO]) -> [Player] {
        dtos.map(toDomain)
    }
}

