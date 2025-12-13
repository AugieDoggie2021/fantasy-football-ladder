import XCTest
@testable import FFLadder

final class CacheStoreTests: XCTestCase {
    
    var cacheStore: FileCacheStore!
    
    override func setUp() {
        super.setUp()
        cacheStore = FileCacheStore.shared
        cacheStore.clear()
    }
    
    override func tearDown() {
        cacheStore.clear()
        super.tearDown()
    }
    
    func testSetAndGet() {
        struct TestData: Codable, Equatable {
            let value: String
        }
        
        let testData = TestData(value: "test")
        cacheStore.set(testData, for: "test-key", ttl: nil)
        
        let retrieved = cacheStore.get("test-key", as: TestData.self)
        XCTAssertEqual(retrieved, testData)
    }
    
    func testTTLExpiry() {
        struct TestData: Codable {
            let value: String
        }
        
        let testData = TestData(value: "test")
        cacheStore.set(testData, for: "test-key", ttl: 0.1) // 100ms TTL
        
        // Should still be there immediately
        let immediate = cacheStore.get("test-key", as: TestData.self)
        XCTAssertNotNil(immediate)
        
        // Wait for expiry
        let expectation = expectation(description: "Wait for TTL")
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            let expired = self.cacheStore.get("test-key", as: TestData.self)
            XCTAssertNil(expired)
            expectation.fulfill()
        }
        
        waitForExpectations(timeout: 0.5)
    }
    
    func testRemove() {
        struct TestData: Codable {
            let value: String
        }
        
        let testData = TestData(value: "test")
        cacheStore.set(testData, for: "test-key", ttl: nil)
        
        cacheStore.remove("test-key")
        
        let retrieved = cacheStore.get("test-key", as: TestData.self)
        XCTAssertNil(retrieved)
    }
    
    func testClear() {
        struct TestData: Codable {
            let value: String
        }
        
        cacheStore.set(TestData(value: "1"), for: "key1", ttl: nil)
        cacheStore.set(TestData(value: "2"), for: "key2", ttl: nil)
        
        cacheStore.clear()
        
        XCTAssertNil(cacheStore.get("key1", as: TestData.self))
        XCTAssertNil(cacheStore.get("key2", as: TestData.self))
    }
}

