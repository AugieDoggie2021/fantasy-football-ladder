import Foundation

protocol WatchlistService {
    func getWatchlist(userId: String) async throws -> Watchlist
    func addPlayer(userId: String, playerId: String) async throws
    func removePlayer(userId: String, playerId: String) async throws
    func isWatched(userId: String, playerId: String) async throws -> Bool
}

#if canImport(Supabase)
import Supabase
#endif

final class SupabaseWatchlistService: WatchlistService {
    #if canImport(Supabase)
    private var client: SupabaseClient? { SupabaseClientProvider.client() as? SupabaseClient }
    #endif
    
    func getWatchlist(userId: String) async throws -> Watchlist {
        return try await NetworkPolicy.execute {
            #if canImport(Supabase)
            guard let client else { throw ServiceError.unknown }
            
            struct WatchlistDTO: Codable {
                let id: String
                let user_id: String
                let player_ids: [String]
            }
            
            let response: [WatchlistDTO] = try await client
                .from("watchlists")
                .select()
                .eq("user_id", value: userId)
                .limit(1)
                .execute()
                .value
            
            if let dto = response.first {
                return Watchlist(id: dto.id, userId: dto.user_id, playerIds: dto.player_ids)
            } else {
                // Create new watchlist
                let newWatchlist = WatchlistDTO(id: UUID().uuidString, user_id: userId, player_ids: [])
                let created: WatchlistDTO = try await client
                    .from("watchlists")
                    .insert(newWatchlist)
                    .select()
                    .single()
                    .execute()
                    .value
                return Watchlist(id: created.id, userId: created.user_id, playerIds: created.player_ids)
            }
            #else
            throw ServiceError.notImplemented
            #endif
        }
    }
    
    func addPlayer(userId: String, playerId: String) async throws {
        return try await NetworkPolicy.execute {
            #if canImport(Supabase)
            guard let client else { throw ServiceError.unknown }
            
            var watchlist = try await getWatchlist(userId: userId)
            guard !watchlist.playerIds.contains(playerId) else { return }
            
            var updatedIds = watchlist.playerIds
            updatedIds.append(playerId)
            
            _ = try await client
                .from("watchlists")
                .update(["player_ids": updatedIds])
                .eq("id", value: watchlist.id)
                .execute()
            #else
            throw ServiceError.notImplemented
            #endif
        }
    }
    
    func removePlayer(userId: String, playerId: String) async throws {
        return try await NetworkPolicy.execute {
            #if canImport(Supabase)
            guard let client else { throw ServiceError.unknown }
            
            var watchlist = try await getWatchlist(userId: userId)
            let updatedIds = watchlist.playerIds.filter { $0 != playerId }
            
            _ = try await client
                .from("watchlists")
                .update(["player_ids": updatedIds])
                .eq("id", value: watchlist.id)
                .execute()
            #else
            throw ServiceError.notImplemented
            #endif
        }
    }
    
    func isWatched(userId: String, playerId: String) async throws -> Bool {
        let watchlist = try await getWatchlist(userId: userId)
        return watchlist.playerIds.contains(playerId)
    }
}

