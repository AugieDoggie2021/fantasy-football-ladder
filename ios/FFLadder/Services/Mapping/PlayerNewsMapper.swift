import Foundation

enum PlayerNewsMapper {
    static func toDomain(_ dto: PlayerNewsDTO) throws -> PlayerNews {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        guard let publishedAt = formatter.date(from: dto.published_at) else {
            throw ServiceError.decoding
        }
        
        return PlayerNews(
            id: dto.id,
            playerId: dto.player_id,
            title: dto.title,
            content: dto.content,
            source: dto.source,
            publishedAt: publishedAt,
            injuryRelated: dto.injury_related ?? false
        )
    }
    
    static func toDomain(_ dtos: [PlayerNewsDTO]) throws -> [PlayerNews] {
        try dtos.map(toDomain)
    }
}

