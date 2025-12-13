import Foundation

enum DraftRankMapper {
    static func toDomain(_ dto: DraftRankDTO) -> DraftRank {
        DraftRank(
            id: dto.id,
            playerId: dto.player_id,
            rank: dto.rank,
            positionRank: dto.position_rank
        )
    }
    
    static func toDomain(_ dtos: [DraftRankDTO]) -> [DraftRank] {
        dtos.map(toDomain)
    }
}

