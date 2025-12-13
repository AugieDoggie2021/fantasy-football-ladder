import Foundation

struct WinProbabilityEngine {
    static func calculate(
        currentScore: Double,
        opponentScore: Double,
        projectedScore: Double,
        opponentProjected: Double
    ) -> Double {
        // If game is live, use current scores + remaining projections
        // Otherwise use full projections
        
        let myRemaining = max(0, projectedScore - currentScore)
        let oppRemaining = max(0, opponentProjected - opponentScore)
        
        let myFinal = currentScore + myRemaining
        let oppFinal = opponentScore + oppRemaining
        
        // Simple probability based on score difference
        let scoreDiff = myFinal - oppFinal
        
        // Use sigmoid-like function to convert score diff to probability
        // Probability = 1 / (1 + e^(-k * diff))
        // k controls steepness (higher = more sensitive to small differences)
        let k = 0.1
        let probability = 1.0 / (1.0 + exp(-k * scoreDiff))
        
        return max(0.0, min(1.0, probability)) // Clamp to [0, 1]
    }
    
    static func calculateHistory(
        scores: [(myScore: Double, oppScore: Double, myProj: Double, oppProj: Double)]
    ) -> [Double] {
        scores.map { calculate(
            currentScore: $0.myScore,
            opponentScore: $0.oppScore,
            projectedScore: $0.myProj,
            opponentProjected: $0.oppProj
        )}
    }
}

