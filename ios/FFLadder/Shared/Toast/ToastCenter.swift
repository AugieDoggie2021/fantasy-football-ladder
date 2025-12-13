import SwiftUI
import Combine

struct ToastMessage: Identifiable, Equatable {
    let id = UUID()
    let text: String
    let style: Style
    
    enum Style {
        case info, success, warning, error
    }
}

final class ToastCenter: ObservableObject {
    @Published var message: ToastMessage? = nil
    
    func show(_ message: ToastMessage, autoDismissAfter seconds: TimeInterval = 2.0) {
        self.message = message
        DispatchQueue.main.asyncAfter(deadline: .now() + seconds) { [weak self] in
            if self?.message == message {
                self?.message = nil
            }
        }
    }
}


