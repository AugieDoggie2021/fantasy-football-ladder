import Foundation

protocol PlayerNewsService {
    func getNews(for playerId: String) async throws -> [PlayerNews]
    func getRecentNews(limit: Int) async throws -> [PlayerNews]
}

#if canImport(Supabase)
import Supabase
#endif

final class SupabasePlayerNewsService: PlayerNewsService {
    #if canImport(Supabase)
    private var client: SupabaseClient? { SupabaseClientProvider.client() as? SupabaseClient }
    #endif
    
    func getNews(for playerId: String) async throws -> [PlayerNews] {
        return try await NetworkPolicy.execute {
            #if canImport(Supabase)
            guard let client else { throw ServiceError.unknown }
            
            let response: [PlayerNewsDTO] = try await client
                .from("player_news")
                .select()
                .eq("player_id", value: playerId)
                .order("published_at", ascending: false)
                .limit(20)
                .execute()
                .value
            
            return try PlayerNewsMapper.toDomain(response)
            #else
            throw ServiceError.notImplemented
            #endif
        }
    }
    
    func getRecentNews(limit: Int) async throws -> [PlayerNews] {
        return try await NetworkPolicy.execute {
            #if canImport(Supabase)
            guard let client else { throw ServiceError.unknown }
            
            let response: [PlayerNewsDTO] = try await client
                .from("player_news")
                .select()
                .order("published_at", ascending: false)
                .limit(limit)
                .execute()
                .value
            
            return try PlayerNewsMapper.toDomain(response)
            #else
            throw ServiceError.notImplemented
            #endif
        }
    }
}

