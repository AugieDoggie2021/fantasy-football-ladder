import Foundation

/// Lightweight periodic tick generator for live updates (stub).
struct LiveUpdateTimer: AsyncSequence {
    typealias Element = Date
    
    struct AsyncIterator: AsyncIteratorProtocol {
        private let interval: TimeInterval
        private var nextFire: Date
        
        init(interval: TimeInterval) {
            self.interval = interval
            self.nextFire = Date()
        }
        
        mutating func next() async -> Date? {
            nextFire = Date().addingTimeInterval(interval)
            let sleepNs = UInt64(interval * 1_000_000_000)
            try? await Task.sleep(nanoseconds: sleepNs)
            return Date()
        }
    }
    
    let interval: TimeInterval
    func makeAsyncIterator() -> AsyncIterator {
        AsyncIterator(interval: interval)
    }
}


