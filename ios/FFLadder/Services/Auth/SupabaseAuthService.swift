import Foundation
import Combine

#if canImport(Supabase)
import Supabase
#endif

final class SupabaseAuthService: AuthService {
    #if canImport(Supabase)
    private var client: SupabaseClient? { SupabaseClientProvider.client() as? SupabaseClient }
    private var authStateTask: Task<Void, Never>?
    #endif
    private let keychain = KeychainStore.shared
    private let sessionKey = "supabase.session"
    private let refreshThreshold: TimeInterval = 300 // Refresh 5 min before expiry
    
    init() {
        #if canImport(Supabase)
        startAuthStateListener()
        #endif
    }
    
    deinit {
        authStateTask?.cancel()
    }
    
    func signInWithMagicLink(email: String) async throws {
        #if canImport(Supabase)
        guard let client else { throw ServiceError.unknown }
        do {
            _ = try await client.auth.signInWithOTP(email: email)
        } catch {
            throw ServiceError.authFailed(error.localizedDescription)
        }
        #else
        throw ServiceError.notImplemented
        #endif
    }
    
    func handleMagicLinkCallback(url: URL) async throws {
        #if canImport(Supabase)
        guard let client else { throw ServiceError.unknown }
        do {
            let session = try await client.auth.session(from: url)
            try await persistSession(session)
        } catch {
            keychain.remove(sessionKey)
            throw ServiceError.authFailed("Failed to complete sign in: \(error.localizedDescription)")
        }
        #else
        throw ServiceError.notImplemented
        #endif
    }
    
    func getCurrentUser() async throws -> User? {
        #if canImport(Supabase)
        guard let client else { return nil }
        
        // Try to restore session from Supabase client first
        do {
            let session = try await client.auth.session
            if let user = session.user {
                try await persistSession(session)
                return User(id: user.id.uuidString, email: user.email ?? "")
            }
        } catch {
            // Session may be expired, try to restore from keychain
            if let restored = try? await restoreSessionFromKeychain() {
                return restored
            }
            // Clear invalid session
            keychain.remove(sessionKey)
            return nil
        }
        
        // Fallback to keychain restore
        return try? await restoreSessionFromKeychain()
        #else
        return nil
        #endif
    }
    
    func signOut() async throws {
        #if canImport(Supabase)
        guard let client else { return }
        do {
            try await client.auth.signOut()
            keychain.remove(sessionKey)
        } catch {
            // Clear keychain even if signOut fails
            keychain.remove(sessionKey)
            throw ServiceError.authFailed("Failed to sign out: \(error.localizedDescription)")
        }
        #else
        // no-op for stub
        #endif
    }
    
    // MARK: - Private Helpers
    
    #if canImport(Supabase)
    private func persistSession(_ session: Session) async throws {
        struct StoredSession: Codable {
            let accessToken: String
            let refreshToken: String
            let expiresAt: Date
            let userId: String
            let email: String?
        }
        
        let stored = StoredSession(
            accessToken: session.accessToken,
            refreshToken: session.refreshToken,
            expiresAt: session.expiresAt,
            userId: session.user.id.uuidString,
            email: session.user.email
        )
        
        let data = try JSONEncoder().encode(stored)
        guard keychain.set(data, for: sessionKey) else {
            throw ServiceError.unknown
        }
    }
    
    private func restoreSessionFromKeychain() async throws -> User? {
        guard let data = keychain.data(for: sessionKey) else { return nil }
        
        struct StoredSession: Codable {
            let accessToken: String
            let refreshToken: String
            let expiresAt: Date
            let userId: String
            let email: String?
        }
        
        guard let stored = try? JSONDecoder().decode(StoredSession.self, from: data) else {
            keychain.remove(sessionKey)
            return nil
        }
        
        // Check if session is expired
        if stored.expiresAt < Date() {
            // Try to refresh
            if let client, let refreshed = try? await refreshSession(refreshToken: stored.refreshToken) {
                try? await persistSession(refreshed)
                return User(id: stored.userId, email: stored.email ?? "")
            } else {
                keychain.remove(sessionKey)
                return nil
            }
        }
        
        // Restore session to client if not already set
        if let client {
            do {
                let currentSession = try? await client.auth.session
                if currentSession?.user.id.uuidString != stored.userId {
                    // Session mismatch, clear and return nil
                    keychain.remove(sessionKey)
                    return nil
                }
            } catch {
                // No active session, but we have stored session - try to set it
                // Note: Supabase client manages its own session, so we just return the user
            }
        }
        
        return User(id: stored.userId, email: stored.email ?? "")
    }
    
    private func refreshSession(refreshToken: String) async throws -> Session? {
        guard let client else { return nil }
        // Supabase handles refresh internally, but we can trigger it
        // by attempting to get the session which will auto-refresh if needed
        let session = try await client.auth.session
        return session
    }
    
    private func startAuthStateListener() {
        // Monitor session and auto-refresh when needed
        authStateTask = Task {
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 60_000_000_000) // Check every minute
                await checkAndRefreshSession()
            }
        }
    }
    
    private func checkAndRefreshSession() async {
        guard let client else { return }
        do {
            let session = try await client.auth.session
            // Check if session expires soon
            let timeUntilExpiry = session.expiresAt.timeIntervalSinceNow
            if timeUntilExpiry < refreshThreshold {
                // Session will expire soon, Supabase should auto-refresh on next call
                // But we proactively refresh by getting a new session
                try? await persistSession(session)
            } else {
                // Session is still valid, just persist it
                try? await persistSession(session)
            }
        } catch {
            // Session invalid, clear keychain
            keychain.remove(sessionKey)
        }
    }
    #endif
}

// Development mock for Debug builds without Supabase
final class MockAuthService: AuthService {
    func signInWithMagicLink(email: String) async throws {
        // simulate delay
        try? await Task.sleep(nanoseconds: 300_000_000)
    }
    func handleMagicLinkCallback(url: URL) async throws {}
    func getCurrentUser() async throws -> User? { User(id: "user-1", email: "user@example.com") }
    func signOut() async throws {}
}




