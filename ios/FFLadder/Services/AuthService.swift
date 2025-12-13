import Foundation

protocol AuthService {
    func signInWithMagicLink(email: String) async throws
    func handleMagicLinkCallback(url: URL) async throws
    func getCurrentUser() async throws -> User?
    func signOut() async throws
}


