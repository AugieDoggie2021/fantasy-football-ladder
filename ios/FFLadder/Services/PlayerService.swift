import Foundation

struct PaginationParams {
    let page: Int
    let pageSize: Int
    
    var offset: Int { page * pageSize }
}

protocol PlayerService {
    func searchPlayers(query: String, pagination: PaginationParams?) async throws -> [Player]
    func getPlayers(for leagueId: String, pagination: PaginationParams?) async throws -> [Player]
}


