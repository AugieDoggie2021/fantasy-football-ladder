import Foundation
import SwiftUI

enum AppDeepLink {
    case magicLink(URL)
    case invite(leagueId: String, token: String)
}

enum URLRouter {
    static func parse(url: URL) -> AppDeepLink? {
        let host = url.host ?? ""
        if host.contains("links.ffladder.app") || url.scheme == "ffladder" {
            if url.path.contains("invite"),
               let leagueId = url.queryItems?["leagueId"],
               let token = url.queryItems?["token"] {
                return .invite(leagueId: leagueId, token: token)
            } else {
                return .magicLink(url)
            }
        }
        return nil
    }
    
    static func route(url: URL, appState: AppState) {
        guard let link = parse(url: url) else { return }
        switch link {
        case .magicLink:
            // Placeholder: AuthService will handle in Phase 2
            appState.pendingAuthURL = url
        case .invite(let leagueId, _):
            // Placeholder: set selected league if exists
            if let league = appState.userLeagues.first(where: { $0.id == leagueId }) {
                appState.selectedLeague = league
            }
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


