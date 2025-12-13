import XCTest
@testable import FFLadder

final class WinProbabilityEngineTests: XCTestCase {
    
    func testWinProbabilityFavoring() {
        let prob = WinProbabilityEngine.calculate(
            currentScore: 100.0,
            opponentScore: 80.0,
            projectedScore: 120.0,
            opponentProjected: 100.0
        )
        
        // Should favor the team with higher score
        XCTAssertGreaterThan(prob, 0.5)
    }
    
    func testWinProbabilityOpponentFavoring() {
        let prob = WinProbabilityEngine.calculate(
            currentScore: 80.0,
            opponentScore: 100.0,
            projectedScore: 100.0,
            opponentProjected: 120.0
        )
        
        // Should favor opponent
        XCTAssertLessThan(prob, 0.5)
    }
    
    func testWinProbabilityEven() {
        let prob = WinProbabilityEngine.calculate(
            currentScore: 100.0,
            opponentScore: 100.0,
            projectedScore: 120.0,
            opponentProjected: 120.0
        )
        
        // Should be close to 0.5
        XCTAssertEqual(prob, 0.5, accuracy: 0.1)
    }
    
    func testWinProbabilityClamped() {
        let prob = WinProbabilityEngine.calculate(
            currentScore: 200.0,
            opponentScore: 0.0,
            projectedScore: 250.0,
            opponentProjected: 50.0
        )
        
        // Should be clamped to [0, 1]
        XCTAssertGreaterThanOrEqual(prob, 0.0)
        XCTAssertLessThanOrEqual(prob, 1.0)
    }
    
    func testWinProbabilityHistory() {
        let history = WinProbabilityEngine.calculateHistory(
            scores: [
                (myScore: 100.0, oppScore: 80.0, myProj: 120.0, oppProj: 100.0),
                (myScore: 105.0, oppScore: 85.0, myProj: 125.0, oppProj: 105.0),
                (myScore: 110.0, oppScore: 90.0, myProj: 130.0, oppProj: 110.0)
            ]
        )
        
        XCTAssertEqual(history.count, 3)
        history.forEach { prob in
            XCTAssertGreaterThanOrEqual(prob, 0.0)
            XCTAssertLessThanOrEqual(prob, 1.0)
        }
    }
}

