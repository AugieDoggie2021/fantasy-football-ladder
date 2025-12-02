//
//  DashboardView.swift
//  FantasyFootballLadder
//
//  Main dashboard showing user leagues
//

import SwiftUI

struct DashboardView: View {
    @StateObject private var authManager = AuthManager.shared
    @State private var leagues: [League] = []
    @State private var isLoading = true
    
    var body: some View {
        NavigationView {
            ZStack {
                if isLoading {
                    ProgressView("Loading your leagues...")
                } else if leagues.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "tray")
                            .font(.system(size: 48))
                            .foregroundColor(.secondary)
                        Text("No leagues yet")
                            .font(.headline)
                        Text("Join or create a league to get started")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                } else {
                    List(leagues) { league in
                        NavigationLink(destination: LeagueDetailView(league: league)) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(league.name)
                                    .font(.headline)
                                if let tier = league.tier {
                                    Text("Tier \(tier)")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("My Leagues")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Sign Out") {
                        authManager.signOut()
                    }
                }
            }
            .onAppear {
                loadLeagues()
            }
        }
    }
    
    private func loadLeagues() {
        // TODO: Implement actual API call to fetch leagues
        // For now, just show empty state
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            isLoading = false
            // Simulate empty leagues for now
            leagues = []
        }
    }
}

#Preview {
    DashboardView()
}

