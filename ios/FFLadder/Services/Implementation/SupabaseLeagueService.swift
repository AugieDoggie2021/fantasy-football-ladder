import Foundation

#if canImport(Supabase)
import Supabase
#endif

final class SupabaseLeagueService: LeagueService {
    #if canImport(Supabase)
    private var client: SupabaseClient? { SupabaseClientProvider.client() as? SupabaseClient }
    #endif
    
    func getLeaguesForUser(userId: String) async throws -> [League] {
        return try await NetworkPolicy.execute {
            #if canImport(Supabase)
            guard let client else { throw ServiceError.unknown }
            
            let response: [LeagueDTO] = try await client
                .from("leagues")
                .select()
                .eq("user_id", value: userId)
                .execute()
                .value
            
            return LeagueMapper.toDomain(response)
            #else
            throw ServiceError.notImplemented
            #endif
        }
    }
    
    func createLeague(name: String) async throws -> League {
        return try await NetworkPolicy.execute {
            #if canImport(Supabase)
            guard let client else { throw ServiceError.unknown }
            
            let code = generateLeagueCode()
            let newLeague = LeagueDTO(
                id: UUID().uuidString,
                name: name,
                code: code,
                created_at: nil,
                updated_at: nil
            )
            
            let response: LeagueDTO = try await client
                .from("leagues")
                .insert(newLeague)
                .select()
                .single()
                .execute()
                .value
            
            return LeagueMapper.toDomain(response)
            #else
            throw ServiceError.notImplemented
            #endif
        }
    }
    
    func joinLeague(code: String) async throws -> League {
        return try await NetworkPolicy.execute {
            #if canImport(Supabase)
            guard let client else { throw ServiceError.unknown }
            
            // First find the league by code
            let response: [LeagueDTO] = try await client
                .from("leagues")
                .select()
                .eq("code", value: code)
                .limit(1)
                .execute()
                .value
            
            guard let leagueDTO = response.first else {
                throw ServiceError.invalidParameters
            }
            
            return LeagueMapper.toDomain(leagueDTO)
            #else
            throw ServiceError.notImplemented
            #endif
        }
    }
    
    private func generateLeagueCode() -> String {
        let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return String((0..<6).map { _ in characters.randomElement()! })
    }
}




