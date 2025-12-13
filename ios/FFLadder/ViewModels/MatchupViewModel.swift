import Foundation

@MainActor
final class MatchupViewModel: ObservableObject {
    @Published var matchup: Matchup? = nil
    @Published var isLoading: Bool = false
    @Published var errorMessage: String? = nil
    @Published var currentWeek: Int = 1
    @Published var lastUpdated: Date? = nil
    @Published var winProbability: Double = 0.5
    @Published var probabilityHistory: [Double] = []
    
    var matchupService: MatchupService?
    var appState: AppState?
    private var liveTimer: LiveUpdateTimer?
    private var liveTask: Task<Void, Never>?
    
    func loadMatchup() async {
        if isLoading { return }
        guard let leagueId = appState?.selectedLeague?.id, let teamId = appState?.userLeagues.first?.id else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            let loaded = try await matchupService?.getMatchup(leagueId: leagueId, week: currentWeek, teamId: teamId)
            matchup = loaded
            lastUpdated = Date()
            
            // Calculate win probability
            if let m = loaded {
                let prob = WinProbabilityEngine.calculate(
                    currentScore: m.score,
                    opponentScore: m.opponentScore,
                    projectedScore: m.projectedScore,
                    opponentProjected: m.opponentProjectedScore
                )
                winProbability = prob
                
                // Add to history (keep last 20)
                probabilityHistory.append(prob)
                if probabilityHistory.count > 20 {
                    probabilityHistory.removeFirst()
                }
            }
        } catch {
            errorMessage = "Failed to load matchup."
        }
    }
    
    func startLiveUpdates(interval: TimeInterval = 30) {
        liveTimer = LiveUpdateTimer(interval: interval)
        liveTask?.cancel()
        liveTask = Task { [weak self] in
            guard let self else { return }
            guard let timer = self.liveTimer else { return }
            for await _ in timer {
                await self.loadMatchup()
            }
        }
    }
    
    func stopLiveUpdates() {
        liveTask?.cancel()
        liveTask = nil
    }
}


