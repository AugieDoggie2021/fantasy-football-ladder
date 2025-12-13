import Foundation
import UserNotifications
import UIKit

final class NotificationManager {
    static let shared = NotificationManager()
    
    private init() {}
    
    func requestPermission() async -> Bool {
        do {
            let granted = try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound])
            return granted
        } catch {
            return false
        }
    }
    
    func registerForRemoteNotifications() {
        UIApplication.shared.registerForRemoteNotifications()
    }
    
    func getDeviceToken() -> String? {
        // Token is received via AppDelegate/SceneDelegate
        // This would be stored after receiving it
        return UserDefaults.standard.string(forKey: "device_push_token")
    }
    
    func saveDeviceToken(_ token: Data) {
        let tokenString = token.map { String(format: "%02.2hhx", $0) }.joined()
        UserDefaults.standard.set(tokenString, forKey: "device_push_token")
        
        // Upload to backend
        Task {
            await uploadTokenToBackend(tokenString)
        }
    }
    
    private func uploadTokenToBackend(_ token: String) async {
        // TODO: Upload token to Supabase
        // This would typically call a Supabase function or insert into a table
        #if canImport(Supabase)
        guard let client = SupabaseClientProvider.client() as? SupabaseClient,
              let userId = await getCurrentUserId() else { return }
        
        struct PushToken: Codable {
            let user_id: String
            let device_token: String
            let platform: String
        }
        
        let tokenData = PushToken(
            user_id: userId,
            device_token: token,
            platform: "ios"
        )
        
        do {
            _ = try await client
                .from("push_tokens")
                .upsert(tokenData, onConflict: "user_id,device_token")
                .execute()
        } catch {
            // Handle error silently
            print("Failed to upload push token: \(error)")
        }
        #endif
    }
    
    private func getCurrentUserId() async -> String? {
        // Get from AppState via notification or stored value
        // For now, get from UserDefaults (set after login)
        return UserDefaults.standard.string(forKey: "current_user_id")
    }
    
    func setCurrentUserId(_ userId: String) {
        UserDefaults.standard.set(userId, forKey: "current_user_id")
    }
}

extension NotificationManager: UNUserNotificationCenterDelegate {
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // Show notification even when app is in foreground
        completionHandler([.banner, .sound, .badge])
    }
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        // Handle notification tap
        let userInfo = response.notification.request.content.userInfo
        
        if let playerId = userInfo["player_id"] as? String {
            // Navigate to player detail
            NotificationCenter.default.post(
                name: NSNotification.Name("NavigateToPlayer"),
                object: nil,
                userInfo: ["player_id": playerId]
            )
        }
        
        completionHandler()
    }
}

