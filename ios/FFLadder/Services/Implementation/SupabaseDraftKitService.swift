import Foundation

#if canImport(Supabase)
import Supabase
#endif

final class SupabaseDraftKitService: DraftKitService {
    #if canImport(Supabase)
    private var client: SupabaseClient? { SupabaseClientProvider.client() as? SupabaseClient }
    #endif
    
    func getRankings() async throws -> [DraftRank] {
        return try await NetworkPolicy.execute {
            #if canImport(Supabase)
            guard let client else { throw ServiceError.unknown }
            
            let response: [DraftRankDTO] = try await client
                .from("draft_rankings")
                .select()
                .order("rank", ascending: true)
                .limit(500)
                .execute()
                .value
            
            return DraftRankMapper.toDomain(response)
            #else
            throw ServiceError.notImplemented
            #endif
        }
    }
}




