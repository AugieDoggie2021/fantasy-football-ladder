import Foundation

enum AppError: Error, LocalizedError {
    case network
    case auth
    case validation(String)
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .network: return "Network error. Please try again."
        case .auth: return "Authentication error. Please log in again."
        case .validation(let message): return message
        case .unknown: return "Something went wrong. Please try again."
        }
    }
}


