import SwiftUI

struct LeagueContainerView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var vm = LeagueContainerViewModel()
    
    var body: some View {
        TabView(selection: $vm.selectedTab) {
            LeagueHomeView()
                .tabItem { Label("Home", systemImage: "house.fill") }
                .tag(0)
            TeamView()
                .tabItem { Label("Team", systemImage: "person.3.fill") }
                .tag(1)
            MatchupView()
                .tabItem { Label("Matchup", systemImage: "shield.lefthalf.fill") }
                .tag(2)
            PlayersView()
                .tabItem { Label("Players", systemImage: "list.bullet.rectangle.portrait.fill") }
                .tag(3)
        }
        .task {
            vm.appState = appState
        }
    }
}


