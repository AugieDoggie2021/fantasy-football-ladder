import Foundation

protocol CacheStore {
    func get<T: Codable>(_ key: String, as type: T.Type) -> T?
    func set<T: Codable>(_ value: T, for key: String, ttl: TimeInterval?)
    func remove(_ key: String)
    func clear()
}

final class FileCacheStore: CacheStore {
    static let shared = FileCacheStore()
    private let cacheDirectory: URL
    private let fileManager = FileManager.default
    
    private init() {
        let cachesDir = fileManager.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        cacheDirectory = cachesDir.appendingPathComponent("FFLadderCache", isDirectory: true)
        
        try? fileManager.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
    }
    
    func get<T: Codable>(_ key: String, as type: T.Type) -> T? {
        let fileURL = cacheDirectory.appendingPathComponent("\(key).json")
        guard let data = try? Data(contentsOf: fileURL) else { return nil }
        
        // Check TTL
        if let metadata = try? getMetadata(for: key),
           let expiresAt = metadata.expiresAt,
           expiresAt < Date() {
            remove(key)
            return nil
        }
        
        return try? JSONDecoder().decode(type, from: data)
    }
    
    func set<T: Codable>(_ value: T, for key: String, ttl: TimeInterval?) {
        let fileURL = cacheDirectory.appendingPathComponent("\(key).json")
        guard let data = try? JSONEncoder().encode(value) else { return }
        
        try? data.write(to: fileURL)
        
        // Store metadata with TTL
        if let ttl = ttl {
            let metadata = CacheMetadata(expiresAt: Date().addingTimeInterval(ttl))
            let metadataURL = cacheDirectory.appendingPathComponent("\(key).meta.json")
            if let metadataData = try? JSONEncoder().encode(metadata) {
                try? metadataData.write(to: metadataURL)
            }
        }
    }
    
    func remove(_ key: String) {
        let fileURL = cacheDirectory.appendingPathComponent("\(key).json")
        let metadataURL = cacheDirectory.appendingPathComponent("\(key).meta.json")
        try? fileManager.removeItem(at: fileURL)
        try? fileManager.removeItem(at: metadataURL)
    }
    
    func clear() {
        try? fileManager.removeItem(at: cacheDirectory)
        try? fileManager.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
    }
    
    private func getMetadata(for key: String) throws -> CacheMetadata {
        let metadataURL = cacheDirectory.appendingPathComponent("\(key).meta.json")
        let data = try Data(contentsOf: metadataURL)
        return try JSONDecoder().decode(CacheMetadata.self, from: data)
    }
}

private struct CacheMetadata: Codable {
    let expiresAt: Date?
}

