import SwiftUI

struct LeagueContainerView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var vm = LeagueContainerViewModel()
    
    var body: some View {
        TabView(selection: $vm.selectedTab) {
            TeamView()
                .tabItem { Label("Team", systemImage: "person.3.fill") }
                .tag(0)
            MatchupView()
                .tabItem { Label("Matchup", systemImage: "shield.lefthalf.fill") }
                .tag(1)
            PlayersView()
                .tabItem { Label("Players", systemImage: "list.bullet.rectangle.portrait.fill") }
                .tag(2)
            LeagueHomeView()
                .tabItem { Label("League", systemImage: "flag.2.crossed.fill") }
                .tag(3)
        }
        .task {
            vm.appState = appState
        }
    }
}


