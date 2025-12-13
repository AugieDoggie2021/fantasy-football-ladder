import Foundation

enum LeagueMapper {
    static func toDomain(_ dto: LeagueDTO) -> League {
        League(
            id: dto.id,
            name: dto.name,
            code: dto.code
        )
    }
    
    static func toDomain(_ dtos: [LeagueDTO]) -> [League] {
        dtos.map(toDomain)
    }
}

