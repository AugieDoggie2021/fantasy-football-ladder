import Foundation

#if canImport(Supabase)
import Supabase
#endif

final class SupabaseMatchupService: MatchupService {
    #if canImport(Supabase)
    private var client: SupabaseClient? { SupabaseClientProvider.client() as? SupabaseClient }
    #endif
    
    func getMatchup(leagueId: String, week: Int, teamId: String) async throws -> Matchup {
        return try await NetworkPolicy.execute {
            #if canImport(Supabase)
            guard let client else { throw ServiceError.unknown }
            
            let response: [MatchupDTO] = try await client
                .from("matchups")
                .select()
                .eq("league_id", value: leagueId)
                .eq("week", value: week)
                .eq("team_id", value: teamId)
                .limit(1)
                .execute()
                .value
            
            guard let matchupDTO = response.first else {
                throw ServiceError.invalidParameters
            }
            
            return MatchupMapper.toDomain(matchupDTO)
            #else
            throw ServiceError.notImplemented
            #endif
        }
    }
}




