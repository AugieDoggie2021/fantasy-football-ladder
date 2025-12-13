import SwiftUI

struct LoadingSkeleton: View {
    @State private var isAnimating = false
    
    var body: some View {
        RoundedRectangle(cornerRadius: 8)
            .fill(Theme.Colors.surfaceElevated)
            .opacity(isAnimating ? 0.6 : 0.3)
            .animation(
                Animation.easeInOut(duration: 1.0)
                    .repeatForever(autoreverses: true),
                value: isAnimating
            )
            .onAppear {
                isAnimating = true
            }
    }
}

struct PlayerRowSkeleton: View {
    var body: some View {
        HStack(spacing: 12) {
            LoadingSkeleton()
                .frame(width: 40, height: 40)
                .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                LoadingSkeleton()
                    .frame(height: 16)
                LoadingSkeleton()
                    .frame(width: 100, height: 12)
            }
            
            Spacer()
            
            LoadingSkeleton()
                .frame(width: 60, height: 20)
        }
        .padding(.vertical, 8)
    }
}

struct LeagueCardSkeleton: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            LoadingSkeleton()
                .frame(height: 24)
            LoadingSkeleton()
                .frame(height: 16)
        }
        .padding()
        .background(Theme.Colors.surface)
        .cornerRadius(12)
    }
}

