import Foundation

#if canImport(Supabase)
import Supabase
#endif

final class SupabaseTeamService: TeamService {
    #if canImport(Supabase)
    private var client: SupabaseClient? { SupabaseClientProvider.client() as? SupabaseClient }
    #endif
    
    func getTeam(leagueId: String, userId: String) async throws -> Team {
        return try await NetworkPolicy.execute {
            #if canImport(Supabase)
            guard let client else { throw ServiceError.unknown }
            
            let response: [TeamDTO] = try await client
                .from("teams")
                .select()
                .eq("league_id", value: leagueId)
                .eq("user_id", value: userId)
                .limit(1)
                .execute()
                .value
            
            guard let teamDTO = response.first else {
                throw ServiceError.invalidParameters
            }
            
            return TeamMapper.toDomain(teamDTO)
            #else
            throw ServiceError.notImplemented
            #endif
        }
    }
    
    func setLineup(leagueId: String, teamId: String, playerIds: [String]) async throws {
        return try await NetworkPolicy.execute {
            #if canImport(Supabase)
            guard let client else { throw ServiceError.unknown }
            
            // Get current team to preserve bench
            let response: [TeamDTO] = try await client
                .from("teams")
                .select()
                .eq("id", value: teamId)
                .limit(1)
                .execute()
                .value
            
            guard let currentTeamDTO = response.first else {
                throw ServiceError.invalidParameters
            }
            
            let currentTeam = TeamMapper.toDomain(currentTeamDTO)
            let currentBench = currentTeam.bench
            
            // Determine which players are in lineup vs bench
            let allPlayerIds = currentTeam.lineup + currentBench
            let newBench = allPlayerIds.filter { !playerIds.contains($0) }
            
            let update: [String: Any] = [
                "lineup": playerIds,
                "bench": newBench
            ]
            
            _ = try await client
                .from("teams")
                .update(update)
                .eq("id", value: teamId)
                .execute()
            #else
            throw ServiceError.notImplemented
            #endif
        }
    }
}




