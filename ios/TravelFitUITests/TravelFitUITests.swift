import XCTest

final class TravelFitUITests: XCTestCase {
    private let app = XCUIApplication(bundleIdentifier: "com.travelfit.app")
    private let password = "travelBetaSteps1234"
    private let timeout: TimeInterval = 20

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testEmulatedWalkerLifecycle() {
        let firstEmail = emailForTestAccount()
        let secondEmail = emailForTestAccount()

        XCTContext.runActivity(named: "Create an account and preview a route without Health access") { _ in
            app.launch()
            passOnboarding()
            register(name: "TravelFit Walker", email: firstEmail)
            tap("health-skip")
            tap("route-start-central-park", in: "routes-list")
            assertMap(title: "Across Central Park")
            waitForLabel("trip-map-status", "Step sync is off.")
            attach("Map and step sync off")
        }

        XCTContext.runActivity(named: "Cancel, then confirm a route replacement and verify history") { _ in
            tap("trip-map-routes")
            tap("route-start-golden-gate", in: "routes-list")
            tapAlertButton("Cancel", alert: "Start a new route?")
            tap("route-start-golden-gate", in: "routes-list")
            tapAlertButton("Start new route", alert: "Start a new route?")
            assertMap(title: "Golden Gate Waterfront")
            openHistory()
            waitForLabel("trip-history-start", "Harlem Meer")
            tap("trip-history-back")
            tap("tab-map")
        }

        XCTContext.runActivity(named: "Connect Health and finish the route with simulator fixture steps") { _ in
            tap("trip-map-connect-health")
            tap("health-connect")
            assertMap(title: "Golden Gate Waterfront")
            waitForLabel("trip-map-status", "Route complete")
            let progress = element("trip-map-progress").label
            XCTAssertTrue(progress.contains("100%"), "The completed route did not show 100%: \(progress)")
            let stepCount = progress.split(separator: "·").last.map { String($0.filter { $0.isNumber }) }
            XCTAssertEqual(stepCount, "20000", "Unexpected fixture step count: \(progress)")
            attach("Completed route with simulated steps")
            signOut()
        }

        XCTContext.runActivity(named: "Use a second account without the first account's history") { _ in
            register(name: "Second Walker", email: secondEmail)
            tap("health-skip")
            tap("route-start-golden-gate", in: "routes-list")
            assertMap(title: "Golden Gate Waterfront")
            waitForLabel("trip-map-status", "Step sync is off.")
            openHistory()
            waitForLabel("trip-history-empty", "No trips yet")
            tap("trip-history-back")
            deleteCurrentAccount()
        }

        XCTContext.runActivity(named: "Restore the first account after a fresh launch, then delete it") { _ in
            requestPasswordResetAndLogIn(email: firstEmail)
            assertMap(title: "Golden Gate Waterfront")
            app.terminate()
            app.launch()
            assertMap(title: "Golden Gate Waterfront")
            waitForLabel("trip-map-status", "Route complete")
            openHistory()
            waitForLabel("trip-history-start", "Harlem Meer")
            tap("trip-history-back")
            deleteCurrentAccount()
            attach("Welcome after account deletion")
        }
    }

    private func emailForTestAccount() -> String {
        "travelfit-e2e-\(UUID().uuidString.lowercased().prefix(12))@example.com"
    }

    private func passOnboarding() {
        let welcome = element("welcome-sign-up")
        let skip = element("onboarding-skip")
        let ready = NSPredicate { _, _ in welcome.exists || skip.exists }
        let expectation = XCTNSPredicateExpectation(predicate: ready, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [expectation], timeout: timeout), .completed,
                       "TravelFit did not open onboarding or Welcome")
        if skip.exists { skip.tap() }
        assertVisible("welcome-sign-up")
    }

    private func register(name: String, email: String) {
        tap("welcome-sign-up")
        fill("sign-up-name", with: name)
        fill("sign-up-email", with: email)
        fill("sign-up-password", with: password, secure: true)
        tap("sign-up-submit", in: "auth-scroll")
    }

    private func requestPasswordResetAndLogIn(email: String) {
        tap("welcome-log-in")
        tap("log-in-forgot-password", in: "auth-scroll")
        fill("reset-password-email", with: email, dismissKeyboard: true)
        tap("reset-password-submit", in: "auth-scroll")
        fill("log-in-email", with: email)
        fill("log-in-password", with: password, secure: true)
        tap("log-in-submit", in: "auth-scroll")
    }

    private func fill(_ identifier: String, with value: String, secure: Bool = false, dismissKeyboard: Bool = false) {
        let field = secure ? app.secureTextFields[identifier] : app.textFields[identifier]
        XCTAssertTrue(field.waitForExistence(withTimeout: timeout), "Missing input \(identifier)")
        if !field.isHittable { app.scrollViews["auth-scroll"].swipeUp() }
        field.tap()
        field.typeText(secure || dismissKeyboard ? value + "\n" : value)
    }

    private func assertMap(title: String) {
        waitForLabel("trip-map-title", title)
        let view = assertVisible("trip-map")
        XCTAssertGreaterThan(view.frame.width, 0, "MapKit viewport has no width")
        XCTAssertGreaterThan(view.frame.height, 0, "MapKit viewport has no height")
    }

    private func openHistory() {
        tap("tab-profile")
        tap("profile-trip-history", in: "profile-content")
    }

    private func signOut() {
        tap("tab-profile")
        tap("profile-sign-out", in: "profile-content")
        assertVisible("welcome-sign-up")
    }

    private func deleteCurrentAccount() {
        tap("profile-delete-account", in: "profile-content")
        tapAlertButton("Delete account", alert: "Delete account?")
        assertVisible("welcome-sign-up")
    }

    private func element(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }

    @discardableResult
    private func assertVisible(_ identifier: String) -> XCUIElement {
        let view = element(identifier)
        XCTAssertTrue(view.waitForExistence(withTimeout: timeout), "TravelFit did not show \(identifier)")
        return view
    }

    private func tap(_ identifier: String, in scrollID: String? = nil) {
        let button = element(identifier)
        if let scrollID {
            let scroll = app.scrollViews[scrollID]
            XCTAssertTrue(scroll.waitForExistence(withTimeout: timeout), "Missing scroll view \(scrollID)")
            for _ in 0..<5 {
                if button.exists && button.isHittable { break }
                scroll.swipeUp()
            }
        }
        let ready = NSPredicate { _, _ in button.exists && button.isHittable && button.isEnabled }
        let expectation = XCTNSPredicateExpectation(predicate: ready, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [expectation], timeout: timeout), .completed,
                       "TravelFit could not activate \(identifier)")
        button.tap()
    }

    private func tapAlertButton(_ title: String, alert: String) {
        let dialog = app.alerts[alert]
        XCTAssertTrue(dialog.waitForExistence(withTimeout: timeout), "Expected alert \(alert)")
        dialog.buttons[title].tap()
    }

    private func waitForLabel(_ identifier: String, _ label: String) {
        let view = assertVisible(identifier)
        let predicate = NSPredicate(format: "label == %@", label)
        let expectation = XCTNSPredicateExpectation(predicate: predicate, object: view)
        XCTAssertEqual(XCTWaiter.wait(for: [expectation], timeout: timeout), .completed,
                       "Expected \(identifier) to display \(label), got \(view.label)")
    }

    private func attach(_ name: String) {
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = name
        screenshot.lifetime = .keepAlways
        add(screenshot)
    }
}
