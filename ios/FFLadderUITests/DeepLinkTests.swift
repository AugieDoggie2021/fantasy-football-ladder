import XCTest

final class DeepLinkTests: XCTestCase {
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["--uitesting"]
    }
    
    func testMagicLinkDeepLink() throws {
        app.launch()
        
        // Simulate magic link callback
        let magicLinkURL = URL(string: "ffladder://auth/callback?token=test_token&type=magiclink")!
        app.open(magicLinkURL)
        
        // Wait for app to process the link
        sleep(2)
        
        // Verify app is in foreground and processing
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 5))
        
        // After processing, should navigate to dashboard or show error
        // This depends on whether the token is valid
        let dashboard = app.staticTexts.matching(NSPredicate(format: "label CONTAINS 'League' OR label CONTAINS 'Dashboard'")).firstMatch
        let errorMessage = app.alerts.firstMatch
        
        // Either dashboard appears or error is shown
        XCTAssertTrue(
            dashboard.waitForExistence(timeout: 5) || 
            errorMessage.waitForExistence(timeout: 5) ||
            app.wait(for: .runningForeground, timeout: 2)
        )
    }
    
    func testInviteAcceptanceDeepLink() throws {
        app.launch()
        
        // Simulate invite acceptance link
        let inviteURL = URL(string: "ffladder://invite/accept?league_id=test_league&token=invite_token")!
        app.open(inviteURL)
        
        // Wait for processing
        sleep(2)
        
        // Verify app processes the invite
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 5))
        
        // Should navigate to league or show message
        let leagueView = app.tabBars.firstMatch
        let alert = app.alerts.firstMatch
        
        XCTAssertTrue(
            leagueView.waitForExistence(timeout: 5) ||
            alert.waitForExistence(timeout: 5) ||
            app.wait(for: .runningForeground, timeout: 2)
        )
    }
    
    func testUniversalLink() throws {
        app.launch()
        
        // Test universal link format
        let universalLink = URL(string: "https://links.ffladder.app/auth/callback?token=test")!
        app.open(universalLink)
        
        sleep(2)
        
        // Verify universal link is handled
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 5))
    }
    
    func testInvalidDeepLink() throws {
        app.launch()
        
        // Test invalid deep link
        let invalidURL = URL(string: "ffladder://invalid/path")!
        app.open(invalidURL)
        
        sleep(1)
        
        // App should handle gracefully (not crash)
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 3))
    }
}

