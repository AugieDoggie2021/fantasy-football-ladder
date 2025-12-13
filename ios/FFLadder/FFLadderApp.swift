import SwiftUI

@main
struct FFLadderApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var appState = AppState()
    @StateObject private var services = ServiceContainer.default()
    @StateObject private var toastCenter = ToastCenter()
    
    var body: some Scene {
        WindowGroup {
            NavigationStack {
                AppRouter()
            }
            .environmentObject(appState)
            .environmentObject(services)
            .environmentObject(toastCenter)
            .onOpenURL { url in
                URLRouter.route(url: url, appState: appState)
            }
            .preferredColorScheme(.dark)
            .toastOverlay()
            .task {
                // Wire appState to services
                services.appState = appState
                // Restore session on app launch
                await restoreSession()
                // Request push notification permission after user is authenticated
                if appState.isAuthenticated {
                    await requestPushPermissionIfNeeded()
                }
            }
            .task(id: appState.pendingAuthURL) {
                guard let url = appState.pendingAuthURL else { return }
                do {
                    try await services.authService.handleMagicLinkCallback(url: url)
                    if let user = try? await services.authService.getCurrentUser() {
                        appState.currentUser = user
                        appState.isAuthenticated = true
                    }
                } catch {
                    toastCenter.show(error.localizedDescription, type: .error)
                }
                appState.pendingAuthURL = nil
            }
        }
    }
    
    private func restoreSession() async {
        appState.isLoading = true
        defer { appState.isLoading = false }
        
        do {
            if let user = try await services.authService.getCurrentUser() {
                appState.currentUser = user
                appState.isAuthenticated = true
            }
        } catch {
            // Session restore failed, user will see login screen
            appState.currentUser = nil
            appState.isAuthenticated = false
        }
    }
    
    private func requestPushPermissionIfNeeded() async {
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        
        if settings.authorizationStatus == .notDetermined {
            let granted = await NotificationManager.shared.requestPermission()
            if granted {
                NotificationManager.shared.registerForRemoteNotifications()
            }
        }
    }
}


