import Foundation

@MainActor
final class LeagueContainerViewModel: ObservableObject {
    @Published var selectedTab: Int = 0
    var appState: AppState?
    
    var league: League? {
        appState?.selectedLeague
    }
}


