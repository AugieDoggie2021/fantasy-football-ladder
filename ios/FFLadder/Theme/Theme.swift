import SwiftUI

enum Theme {
    // Colors
    static let brandBlue = Color(red: 0.10, green: 0.14, blue: 0.30)
    static let gradientStart = Color(red: 0.07, green: 0.09, blue: 0.20)
    static let gradientEnd = Color(red: 0.03, green: 0.04, blue: 0.10)
    static let surface = Color(red: 0.12, green: 0.14, blue: 0.22)
    static let surfaceElevated = Color(red: 0.16, green: 0.18, blue: 0.28)
    static let accent = Color(red: 0.29, green: 0.56, blue: 1.00)
    static let success = Color.green
    static let warning = Color.orange
    static let error = Color.red
    static let textPrimary = Color.white
    static let textSecondary = Color.white.opacity(0.7)
    
    // Fonts
    static func titleFont() -> Font { .system(size: 28, weight: .bold, design: .rounded) }
    static func headingFont() -> Font { .system(size: 20, weight: .semibold, design: .rounded) }
    static func bodyFont() -> Font { .system(size: 16, weight: .regular, design: .rounded) }
    static func captionFont() -> Font { .system(size: 13, weight: .regular, design: .rounded) }
    
    // Shadows / Depth
    static func cardShadow() -> Shadow {
        Shadow(color: Color.black.opacity(0.4), radius: 16, x: 0, y: 8)
    }
    
    struct Shadow {
        let color: Color
        let radius: CGFloat
        let x: CGFloat
        let y: CGFloat
    }
}

extension View {
    func themedCardBackground() -> some View {
        self
            .background(
                LinearGradient(
                    colors: [Theme.surfaceElevated, Theme.surface],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .cornerRadius(16)
            .shadow(color: Theme.cardShadow().color, radius: Theme.cardShadow().radius, x: Theme.cardShadow().x, y: Theme.cardShadow().y)
    }
    
    func primaryGradientBackground() -> some View {
        self
            .background(
                LinearGradient(
                    colors: [Theme.gradientStart, Theme.gradientEnd],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
    }
}


