import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var toastCenter: ToastCenter
    @EnvironmentObject private var services: ServiceContainer
    @StateObject private var vm = LoginViewModel()
    
    var body: some View {
        VStack(spacing: 24) {
            Text("Sign in")
                .font(Theme.titleFont())
                .foregroundColor(Theme.textPrimary)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            CardView {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Magic link")
                        .font(Theme.headingFont())
                        .foregroundColor(Theme.textPrimary)
                    TextField("you@example.com", text: $vm.email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                        .padding(12)
                        .background(Theme.surface)
                        .cornerRadius(8)
                    
                    Button {
                        Task {
                            await vm.requestMagicLink()
                            if let msg = vm.infoMessage {
                                toastCenter.show(.init(text: msg, style: .success))
                            } else if let err = vm.errorMessage {
                                toastCenter.show(.init(text: err, style: .error))
                            }
                        }
                    } label: {
                        Text(vm.isSubmitting ? "Sending..." : "Send magic link")
                            .bold()
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Theme.accent)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    }
                    .disabled(vm.isSubmitting)
                    .accessibilityLabel("Send magic link")
                }
            }
            
            Spacer()
        }
        .padding(16)
        .background(
            LinearGradient(colors: [Theme.gradientStart, Theme.gradientEnd], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
        )
        .onOpenURL { url in
            URLRouter.route(url: url, appState: appState)
        }
        .task {
            vm.authService = services.authService
        }
    }
}


