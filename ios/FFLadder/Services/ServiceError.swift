import Foundation

enum ServiceError: Error {
    case notImplemented
    case invalidParameters
    case network
    case unauthorized
    case decoding
    case authFailed(String)
    case unknown
    
    var localizedDescription: String {
        switch self {
        case .notImplemented:
            return "Feature not yet implemented"
        case .invalidParameters:
            return "Invalid parameters provided"
        case .network:
            return "Network error occurred"
        case .unauthorized:
            return "Unauthorized access"
        case .decoding:
            return "Failed to decode response"
        case .authFailed(let message):
            return message
        case .unknown:
            return "An unknown error occurred"
        }
    }
}


