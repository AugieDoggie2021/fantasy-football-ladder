import Foundation

protocol AnalyticsService {
    func track(event: String, parameters: [String: Any]?)
}

final class AnalyticsServiceProvider: AnalyticsService {
    static let shared = AnalyticsServiceProvider()
    
    func track(event: String, parameters: [String: Any]?) {
        // Redact PII from parameters
        let sanitized = sanitizeParameters(parameters)
        
        #if DEBUG
        print("[Analytics] \(event): \(sanitized ?? [:])")
        #endif
        
        // TODO: Integrate with analytics SDK (Amplitude, Segment, etc.)
        // For now, just log
    }
    
    private func sanitizeParameters(_ params: [String: Any]?) -> [String: Any]? {
        guard var params = params else { return nil }
        
        // Redact email addresses
        if let email = params["email"] as? String {
            params["email"] = redactEmail(email)
        }
        
        // Redact user IDs (keep last 4 chars)
        if let userId = params["user_id"] as? String {
            params["user_id"] = "***\(String(userId.suffix(4)))"
        }
        
        return params
    }
    
    private func redactEmail(_ email: String) -> String {
        guard let atIndex = email.firstIndex(of: "@") else { return "***" }
        let prefix = String(email[..<atIndex])
        let domain = String(email[email.index(after: atIndex)...])
        
        if prefix.count <= 2 {
            return "***@\(domain)"
        }
        
        let redactedPrefix = String(prefix.prefix(2)) + "***"
        return "\(redactedPrefix)@\(domain)"
    }
}

// Analytics event constants
enum AnalyticsEvent {
    static let loginSuccess = "login_success"
    static let leagueEnter = "league_enter"
    static let tabView = "tab_view"
    static let inviteSent = "invite_sent"
    static let playerSearch = "player_search"
    static let lineupSaved = "lineup_saved"
    static let playerWatched = "player_watched"
    static let playerUnwatched = "player_unwatched"
}

