import Foundation
import Combine

final class LoginViewModel: ObservableObject {
    @Published var email: String = ""
    @Published var isSubmitting: Bool = false
    @Published var errorMessage: String? = nil
    @Published var infoMessage: String? = nil
    
    var authService: AuthService?
    
    @MainActor
    func requestMagicLink() async {
        guard !email.isEmpty else {
            errorMessage = "Email is required."
            return
        }
        isSubmitting = true
        defer { isSubmitting = false }
        do {
            try await authService?.signInWithMagicLink(email: email)
            infoMessage = "Check your email for the magic link."
        } catch {
            errorMessage = (error as? AppError)?.localizedDescription ?? "Failed to send magic link."
        }
    }
}


