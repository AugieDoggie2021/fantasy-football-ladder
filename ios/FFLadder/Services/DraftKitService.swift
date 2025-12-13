import Foundation

protocol DraftKitService {
    func getRankings() async throws -> [DraftRank]
}


