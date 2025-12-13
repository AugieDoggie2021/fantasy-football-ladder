import SwiftUI

struct SparklineView: View {
    let data: [Double]
    
    var body: some View {
        GeometryReader { geometry in
            Path { path in
                guard !data.isEmpty else { return }
                
                let width = geometry.size.width
                let height = geometry.size.height
                let stepX = width / CGFloat(max(1, data.count - 1))
                
                let minValue = data.min() ?? 0
                let maxValue = data.max() ?? 1
                let range = maxValue - minValue
                
                for (index, value) in data.enumerated() {
                    let x = CGFloat(index) * stepX
                    let normalized = range > 0 ? (value - minValue) / range : 0.5
                    let y = height * (1 - CGFloat(normalized))
                    
                    if index == 0 {
                        path.move(to: CGPoint(x: x, y: y))
                    } else {
                        path.addLine(to: CGPoint(x: x, y: y))
                    }
                }
            }
            .stroke(Theme.accent, lineWidth: 2)
        }
    }
}

