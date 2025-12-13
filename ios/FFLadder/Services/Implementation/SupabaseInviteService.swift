import Foundation

#if canImport(Supabase)
import Supabase
#endif

final class SupabaseInviteService: InviteService {
    #if canImport(Supabase)
    private var client: SupabaseClient? { SupabaseClientProvider.client() as? SupabaseClient }
    #endif
    
    func sendInvite(to email: String, leagueId: String) async throws {
        #if canImport(Supabase)
        _ = (email, leagueId)
        #else
        throw ServiceError.notImplemented
        #endif
    }
    
    func getInvites(leagueId: String, pagination: PaginationParams?) async throws -> [Invite] {
        return try await NetworkPolicy.execute {
            #if canImport(Supabase)
            guard let client else { throw ServiceError.unknown }
            
            var queryBuilder = client
                .from("invites")
                .select()
                .eq("league_id", value: leagueId)
                .order("created_at", ascending: false)
            
            if let pagination {
                queryBuilder = queryBuilder
                    .range(from: pagination.offset, to: pagination.offset + pagination.pageSize - 1)
            } else {
                queryBuilder = queryBuilder.limit(100)
            }
            
            let response: [InviteDTO] = try await queryBuilder
                .execute()
                .value
            
            return InviteMapper.toDomain(response)
            #else
            throw ServiceError.notImplemented
            #endif
        }
    }
    
    func sendInvite(to email: String, leagueId: String) async throws {
        return try await NetworkPolicy.execute {
            #if canImport(Supabase)
            guard let client else { throw ServiceError.unknown }
            
            let invite = InviteDTO(
                id: UUID().uuidString,
                league_id: leagueId,
                email: email,
                status: "pending",
                created_at: nil,
                expires_at: nil
            )
            
            _ = try await client
                .from("invites")
                .insert(invite)
                .execute()
            #else
            throw ServiceError.notImplemented
            #endif
        }
    }
}




