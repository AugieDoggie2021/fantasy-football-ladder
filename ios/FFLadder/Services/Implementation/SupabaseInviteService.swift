import Foundation

#if canImport(Supabase)
import Supabase
#endif

final class SupabaseInviteService: InviteService {
    #if canImport(Supabase)
    private var client: SupabaseClient? { SupabaseClientProvider.client() as? SupabaseClient }
    #endif
    
    func sendInvite(to email: String, leagueId: String) async throws -> String? {
        return try await NetworkPolicy.execute {
            #if canImport(Supabase)
            guard let client else { throw ServiceError.unknown }
            
            // Generate token
            let token = UUID().uuidString.replacingOccurrences(of: "-", with: "")
            
            let invite = InviteDTO(
                id: UUID().uuidString,
                league_id: leagueId,
                email: email.isEmpty ? nil : email,
                status: "pending",
                token: token,
                created_at: nil,
                expires_at: nil
            )
            
            let response: InviteDTO = try await client
                .from("league_invites")
                .insert(invite)
                .select()
                .single()
                .execute()
                .value
            
            return response.token
            #else
            throw ServiceError.notImplemented
            #endif
        }
    }
    
    func createInviteLink(leagueId: String) async throws -> String {
        return try await NetworkPolicy.execute {
            #if canImport(Supabase)
            guard let client else { throw ServiceError.unknown }
            
            // Generate token
            let token = UUID().uuidString.replacingOccurrences(of: "-", with: "")
            
            let invite = InviteDTO(
                id: UUID().uuidString,
                league_id: leagueId,
                email: nil,
                status: "pending",
                token: token,
                created_at: nil,
                expires_at: nil
            )
            
            let response: InviteDTO = try await client
                .from("league_invites")
                .insert(invite)
                .select()
                .single()
                .execute()
                .value
            
            guard let inviteToken = response.token else {
                throw ServiceError.unknown
            }
            
            return inviteToken
            #else
            throw ServiceError.notImplemented
            #endif
        }
    }
    
    func getInvites(leagueId: String, pagination: PaginationParams?) async throws -> [Invite] {
        return try await NetworkPolicy.execute {
            #if canImport(Supabase)
            guard let client else { throw ServiceError.unknown }
            
            var queryBuilder = client
                .from("league_invites")
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
    
    func getInviteByToken(token: String) async throws -> InviteDetails {
        return try await NetworkPolicy.execute {
            #if canImport(Supabase)
            guard let client else { throw ServiceError.unknown }
            
            struct InviteDetailsDTO: Codable {
                let id: String
                let league_id: String
                let email: String?
                let status: String
                let token: String
                let leagues: LeagueInfoDTO?
            }
            
            struct LeagueInfoDTO: Codable {
                let id: String
                let name: String
                let max_teams: Int
                let teams: [TeamCountDTO]?
            }
            
            struct TeamCountDTO: Codable {
                let id: String
            }
            
            let response: InviteDetailsDTO = try await client
                .from("league_invites")
                .select("""
                    id,
                    league_id,
                    email,
                    status,
                    token,
                    leagues (
                        id,
                        name,
                        max_teams,
                        teams!inner (id)
                    )
                """)
                .eq("token", value: token)
                .single()
                .execute()
                .value
            
            guard let league = response.leagues else {
                throw ServiceError.unknown
            }
            
            let teamCount = league.teams?.count ?? 0
            
            return InviteDetails(
                id: response.id,
                leagueId: response.league_id,
                leagueName: league.name,
                email: response.email,
                status: response.status,
                maxTeams: league.max_teams,
                teamCount: teamCount
            )
            #else
            throw ServiceError.notImplemented
            #endif
        }
    }
    
    func acceptInvite(token: String, teamName: String) async throws -> AcceptInviteResult {
        return try await NetworkPolicy.execute {
            #if canImport(Supabase)
            guard let client else { throw ServiceError.unknown }
            
            // First get invite details
            let inviteDetails = try await getInviteByToken(token: token)
            
            // Get current user ID first
            let session = try await client.auth.session
            let userId = session.user.id.uuidString.lowercased()
            
            // Check if user already has a team in this league
            struct UserTeamDTO: Codable {
                let id: String
                let owner_user_id: String
            }
            
            let userTeams: [UserTeamDTO] = try await client
                .from("teams")
                .select("id, owner_user_id")
                .eq("league_id", value: inviteDetails.leagueId)
                .eq("is_active", value: true)
                .execute()
                .value
            
            // Check if user already has a team
            if userTeams.contains(where: { $0.owner_user_id.lowercased() == userId }) {
                throw ServiceError.unknown // User already has a team
            }
            
            // Create team
            struct TeamDTO: Codable {
                let id: String
                let league_id: String
                let owner_user_id: String
                let name: String
                let is_active: Bool
            }
            
            let team = TeamDTO(
                id: UUID().uuidString,
                league_id: inviteDetails.leagueId,
                owner_user_id: userId,
                name: teamName,
                is_active: true
            )
            
            let createdTeam: TeamDTO = try await client
                .from("teams")
                .insert(team)
                .select()
                .single()
                .execute()
                .value
            
            // Mark invite as accepted
            _ = try await client
                .from("league_invites")
                .update(["status": "accepted"])
                .eq("id", value: inviteDetails.id)
                .execute()
            
            return AcceptInviteResult(
                leagueId: inviteDetails.leagueId,
                teamId: createdTeam.id
            )
            #else
            throw ServiceError.notImplemented
            #endif
        }
    }
}




