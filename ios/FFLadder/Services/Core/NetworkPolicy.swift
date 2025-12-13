import Foundation

enum NetworkPolicy {
    static let maxRetries = 3
    static let baseBackoff: TimeInterval = 1.0
    static let maxBackoff: TimeInterval = 10.0
    
    /// Execute a network operation with retry and exponential backoff
    static func execute<T>(
        maxRetries: Int = maxRetries,
        operation: @escaping () async throws -> T
    ) async throws -> T {
        var lastError: Error?
        
        for attempt in 0..<maxRetries {
            do {
                return try await operation()
            } catch {
                lastError = error
                
                // Don't retry on certain errors
                if shouldNotRetry(error) {
                    throw error
                }
                
                // If this is the last attempt, throw
                if attempt == maxRetries - 1 {
                    break
                }
                
                // Calculate backoff with exponential backoff and jitter
                let backoff = min(
                    baseBackoff * pow(2.0, Double(attempt)),
                    maxBackoff
                )
                let jitter = Double.random(in: 0...0.3) * backoff
                let delay = backoff + jitter
                
                try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            }
        }
        
        // Map the error to a ServiceError
        throw mapError(lastError ?? ServiceError.unknown)
    }
    
    /// Check if an error should not be retried
    private static func shouldNotRetry(_ error: Error) -> Bool {
        if let serviceError = error as? ServiceError {
            switch serviceError {
            case .unauthorized, .invalidParameters, .notImplemented:
                return true
            default:
                return false
            }
        }
        
        // Don't retry on 4xx errors (client errors)
        if let urlError = error as? URLError {
            switch urlError.code {
            case .badURL, .unsupportedURL, .cannotFindHost, .cannotConnectToHost,
                 .networkConnectionLost, .dnsLookupFailed, .httpTooManyRedirects,
                 .resourceUnavailable, .notConnectedToInternet, .timedOut:
                return false // These are retryable
            case .badServerResponse, .cannotDecodeContentData, .cannotDecodeRawData,
                 .cannotParseResponse, .dataNotAllowed, .fileDoesNotExist,
                 .fileIsDirectory, .noPermissionsToReadFile, .secureConnectionFailed,
                 .serverCertificateHasBadDate, .serverCertificateHasUnknownRoot,
                 .serverCertificateNotYetValid, .serverCertificateUntrusted,
                 .userAuthenticationRequired, .userCancelledAuthentication:
                return true // These are not retryable
            default:
                return false
            }
        }
        
        return false
    }
    
    /// Map network errors to ServiceError
    static func mapError(_ error: Error?) -> ServiceError {
        guard let error = error else { return .unknown }
        
        if let serviceError = error as? ServiceError {
            return serviceError
        }
        
        if let urlError = error as? URLError {
            switch urlError.code {
            case .notConnectedToInternet, .networkConnectionLost, .cannotConnectToHost:
                return .network
            case .timedOut:
                return .network
            case .badServerResponse:
                if let httpResponse = urlError.userInfo[URLErrorKey.localizedDescriptionKey] as? String,
                   httpResponse.contains("401") || httpResponse.contains("403") {
                    return .unauthorized
                }
                return .decoding
            default:
                return .network
            }
        }
        
        // Check for decoding errors
        if error is DecodingError {
            return .decoding
        }
        
        return .unknown
    }
}

