import Foundation
import Combine

final class AppState: ObservableObject {
    // User/session
    @Published var currentUser: User? = nil {
        didSet {
            if let userId = currentUser?.id {
                NotificationManager.shared.setCurrentUserId(userId)
            }
        }
    }
    @Published var pendingAuthURL: URL? = nil
    @Published var pendingInviteToken: String? = nil
    
    // Leagues
    @Published var userLeagues: [League] = []
    @Published var selectedLeague: League? = nil
    
    // Optional caches
    @Published var playersCache: [Player]? = nil
    @Published var playersCacheExpiry: Date? = nil
    
    // UI flags
    @Published var isLoading: Bool = false
    @Published var isAuthenticated: Bool = false
}


