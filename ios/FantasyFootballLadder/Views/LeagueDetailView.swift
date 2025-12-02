//
//  LeagueDetailView.swift
//  FantasyFootballLadder
//
//  Placeholder for league detail view
//

import SwiftUI

struct LeagueDetailView: View {
    let league: League
    
    var body: some View {
        VStack(spacing: 20) {
            Text(league.name)
                .font(.title)
            Text("League detail view coming soon")
                .foregroundColor(.secondary)
        }
        .navigationTitle("League")
    }
}

#Preview {
    LeagueDetailView(league: League(id: "1", name: "Test League", tier: 1))
}

