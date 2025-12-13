import SwiftUI

struct ToastOverlay: ViewModifier {
    @EnvironmentObject private var toastCenter: ToastCenter
    
    func body(content: Content) -> some View {
        ZStack {
            content
            if let message = toastCenter.message {
                VStack {
                    Spacer()
                    CardView {
                        HStack(spacing: 12) {
                            Circle()
                                .fill(color(for: message.style))
                                .frame(width: 10, height: 10)
                            Text(message.text)
                                .font(Theme.bodyFont())
                                .foregroundColor(Theme.textPrimary)
                            Spacer(minLength: 0)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 24)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .animation(.spring(), value: message)
            }
        }
    }
    
    private func color(for style: ToastMessage.Style) -> Color {
        switch style {
        case .info: return Theme.accent
        case .success: return Theme.success
        case .warning: return Theme.warning
        case .error: return Theme.error
        }
    }
}

extension View {
    func toastOverlay() -> some View {
        modifier(ToastOverlay())
    }
}


