import Foundation

enum InviteMapper {
    static func toDomain(_ dto: InviteDTO) -> Invite {
        Invite(
            id: dto.id,
            leagueId: dto.league_id,
            email: dto.email ?? "",
            status: dto.status
        )
    }
    
    static func toDomain(_ dtos: [InviteDTO]) -> [Invite] {
        dtos.map(toDomain)
    }
}

