import SwiftUI

struct Pill: View {
    let text: String
    let background: Color
    let foreground: Color
    
    enum Style {
        case `default`
        case error
        case warning
        case info
        case success
    }
    
    init(text: String, style: Style = .default, background: Color? = nil, foreground: Color? = nil) {
        self.text = text
        
        switch style {
        case .default:
            self.background = background ?? Theme.surfaceElevated
            self.foreground = foreground ?? Theme.textPrimary
        case .error:
            self.background = Color.red.opacity(0.2)
            self.foreground = .red
        case .warning:
            self.background = Color.orange.opacity(0.2)
            self.foreground = .orange
        case .info:
            self.background = Color.blue.opacity(0.2)
            self.foreground = .blue
        case .success:
            self.background = Color.green.opacity(0.2)
            self.foreground = .green
        }
    }
    
    var body: some View {
        Text(text.uppercased())
            .font(.caption.bold())
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(background)
            .foregroundColor(foreground)
            .clipShape(Capsule())
    }
}

struct LivePill: View {
    var body: some View {
        Pill(text: "LIVE", background: Color.red.opacity(0.2), foreground: .red)
    }
}


