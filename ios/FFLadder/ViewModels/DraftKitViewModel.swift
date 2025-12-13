import Foundation

@MainActor
final class DraftKitViewModel: ObservableObject {
    @Published var rankings: [DraftRank] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String? = nil
    @Published var positionFilter: String? = nil
    
    var draftKitService: DraftKitService?
    
    func loadRankings() async {
        isLoading = true
        defer { isLoading = false }
        do {
            rankings = try await draftKitService?.getRankings() ?? []
        } catch {
            errorMessage = "Failed to load rankings."
        }
    }
}


