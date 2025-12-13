import Foundation

#if canImport(Supabase)
import Supabase
#endif

final class SupabasePlayerService: PlayerService {
    #if canImport(Supabase)
    private var client: SupabaseClient? { SupabaseClientProvider.client() as? SupabaseClient }
    #endif
    
    func searchPlayers(query: String, pagination: PaginationParams?) async throws -> [Player] {
        return try await NetworkPolicy.execute {
            #if canImport(Supabase)
            guard let client else { throw ServiceError.unknown }
            
            let searchQuery = query.trimmingCharacters(in: .whitespaces)
            guard !searchQuery.isEmpty else { return [] }
            
            var queryBuilder = client
                .from("players")
                .select()
                .ilike("name", pattern: "%\(searchQuery)%")
            
            if let pagination {
                queryBuilder = queryBuilder
                    .range(from: pagination.offset, to: pagination.offset + pagination.pageSize - 1)
            } else {
                queryBuilder = queryBuilder.limit(50)
            }
            
            let response: [PlayerDTO] = try await queryBuilder
                .execute()
                .value
            
            return PlayerMapper.toDomain(response)
            #else
            throw ServiceError.notImplemented
            #endif
        }
    }
    
    func getPlayers(for leagueId: String, pagination: PaginationParams?) async throws -> [Player] {
        return try await NetworkPolicy.execute {
            #if canImport(Supabase)
            guard let client else { throw ServiceError.unknown }
            
            var queryBuilder = client
                .from("players")
                .select()
            
            if let pagination {
                queryBuilder = queryBuilder
                    .range(from: pagination.offset, to: pagination.offset + pagination.pageSize - 1)
            } else {
                queryBuilder = queryBuilder.limit(500)
            }
            
            let response: [PlayerDTO] = try await queryBuilder
                .execute()
                .value
            
            return PlayerMapper.toDomain(response)
            #else
            throw ServiceError.notImplemented
            #endif
        }
    }
}




