//
//  FantasyFootballLadderApp.swift
//  FantasyFootballLadder
//
//  Created for Fantasy Football Ladder iOS App
//

import SwiftUI

@main
struct FantasyFootballLadderApp: App {
    @StateObject private var authManager = AuthManager.shared
    
    var body: some Scene {
        WindowGroup {
            if authManager.isAuthenticated {
                DashboardView()
            } else {
                LoginView()
            }
        }
    }
}

