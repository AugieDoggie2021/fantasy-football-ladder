import Foundation
import SwiftUI

enum AppDeepLink {
    case magicLink(URL)
    case inviteJoin(token: String)
}

enum URLRouter {
    static func parse(url: URL) -> AppDeepLink? {
        let host = url.host ?? ""
        let path = url.path
        
        // Handle web universal links (fantasyladder.app/join/:token)
        if host.contains("fantasyladder.app") || host.contains("links.ffladder.app") {
            // Match /join/:token pattern
            if path.hasPrefix("/join/") {
                let token = String(path.dropFirst(6)) // Remove "/join/"
                if !token.isEmpty {
                    return .inviteJoin(token: token)
                }
            }
            // Legacy invite pattern with query params
            if path.contains("invite"),
               let token = url.queryItems?["token"] {
                return .inviteJoin(token: token)
            }
            // Magic link for auth
            if path.contains("auth") || path.contains("callback") {
                return .magicLink(url)
            }
        }
        
        // Handle custom URL scheme (ffladder://join/:token)
        if url.scheme == "ffladder" {
            if path.hasPrefix("/join/") {
                let token = String(path.dropFirst(6))
                if !token.isEmpty {
                    return .inviteJoin(token: token)
                }
            }
            // Fallback to magic link
            return .magicLink(url)
        }
        
        return nil
    }
    
    static func route(url: URL, appState: AppState) {
        guard let link = parse(url: url) else { return }
        switch link {
        case .magicLink:
            appState.pendingAuthURL = url
        case .inviteJoin(let token):
            // Set pending invite token to be handled by AppRouter
            appState.pendingInviteToken = token
        }
    }
}

private extension URL {
    var queryItems: [String: String]? {
        URLComponents(url: self, resolvingAgainstBaseURL: false)?
            .queryItems?
            .reduce(into: [String: String](), { $0[$1.name] = $1.value })
    }
}


