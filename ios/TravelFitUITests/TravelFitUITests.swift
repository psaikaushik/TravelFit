import XCTest

final class TravelFitUITests: XCTestCase {
    private let app = XCUIApplication(bundleIdentifier: "com.travelfit.app")
    private let password = "travelBetaSteps1234"
    private let timeout: TimeInterval = 20
    private var passwordSavePromptMayAppear = false

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testEmulatedWalkerLifecycle() throws {
        #if targetEnvironment(simulator)
        walkThroughAccountLifecycle(useHealthFixture: true)
        #else
        throw XCTSkip("Run the Health fixture test in the simulator.")
        #endif
    }

    func testSignedDeviceWalkerLifecycle() throws {
        #if targetEnvironment(simulator)
        throw XCTSkip("Run the staging test on a signed physical iPhone build.")
        #else
        walkThroughAccountLifecycle(useHealthFixture: false)
        #endif
    }

    private func walkThroughAccountLifecycle(useHealthFixture: Bool) {
        let domain = useHealthFixture ? "x.test" : "x.invalid"
        let firstEmail = emailForTestAccount(domain: domain)
        let secondEmail = emailForTestAccount(domain: domain)

        XCTContext.runActivity(named: "Create an account and preview a route without Health access") { _ in
            app.launch()
            passOnboarding()
            attach("Welcome")
            tap("welcome-privacy")
            assertVisible("Privacy Policy")
            attach("Privacy policy")
            tap("privacy-back")
            assertVisible("welcome-sign-up")
            register(name: "Avery Walker", email: firstEmail)
            attach("Apple Health setup")
            tap("health-skip")
            assertVisible("Choose a virtual route")
            attach("Route picker")
            startFirstRoute("route-start-central-park")
            assertMap(title: "Across Central Park")
            waitForLabel("trip-map-status", "Step sync is off.")
            attach("Map and step sync off")
        }

        XCTContext.runActivity(named: "Cancel, then confirm a route replacement and verify history") { _ in
            tap("trip-map-routes")
            tap("route-start-golden-gate", in: "routes-list")
            tapAlertButton("Cancel", alert: "Start a new route?")
            tap("routes-back")
            assertMap(title: "Across Central Park")
            tap("trip-map-routes")
            tap("route-start-golden-gate", in: "routes-list")
            tapAlertButton("Start new route", alert: "Start a new route?")
            assertMap(title: "Golden Gate Waterfront")
            openHistory()
            waitForLabel("trip-history-start", "Harlem Meer")
            attach("Archived route in trip history")
            tap("trip-history-back")
            tap("tab-map")
        }

        if useHealthFixture {
            XCTContext.runActivity(named: "Connect Health, then resume with additional simulated steps") { _ in
                tap("trip-map-connect-health")
                tap("health-connect")
                assertMap(title: "Golden Gate Waterfront")
                waitForLabel("trip-map-status", "Steps synced")
                assertMapStepCount("1200")
                attach("Partial route progress with simulated steps")

                XCUIDevice.shared.press(.home)
                let inBackground = NSPredicate { _, _ in
                    self.app.state == .runningBackground || self.app.state == .runningBackgroundSuspended
                }
                let expectation = XCTNSPredicateExpectation(predicate: inBackground, object: nil)
                XCTAssertEqual(XCTWaiter.wait(for: [expectation], timeout: timeout), .completed,
                               "TravelFit did not move into the background")
                app.activate()
                waitForLabel("trip-map-status", "Route complete")
                let progress = element("trip-map-progress").label
                XCTAssertTrue(progress.contains("100%"), "The completed route did not show 100%: \(progress)")
                assertMapStepCount("20000")
                attach("Completed route with simulated steps")
                tap("tab-progress")
                waitForLabel("progress-daily-goal", "Goal reached!", contains: true)
                attach("Daily goal reached")
                let history = element("progress-day-ThreeDaysBefore")
                reveal(history, in: "progress-scroll")
                XCTAssertTrue(history.exists && history.isHittable, "Unable to scroll to the last daily history row")
                attach("Daily step history")
                tap("tab-achievements")
                assertVisible("Torpedo Wharf")
                attach("Landmark achievements")
                tap("tab-profile")
                tap("profile-statistics", in: "profile-content")
                waitForLabel("statistics-week-total", "20,000")
                attach("Weekly step totals")
                tap("statistics-month-tab")
                waitForLabel("statistics-month-total", "20,000")
                attach("Monthly step totals")
                tap("statistics-back")
            }
        } else {
            waitForLabel("trip-map-status", "Step sync is off.")
        }
        signOut()

        XCTContext.runActivity(named: "Use a second account without the first account's history") { _ in
            register(name: "Second Walker", email: secondEmail)
            tap("health-skip")
            startFirstRoute("route-start-seattle-waterfront")
            assertMap(title: "Along the Seattle Waterfront")
            waitForLabel("trip-map-status", "Step sync is off.")
            openHistory()
            waitForLabel("trip-history-empty", "No trips yet")
            tap("trip-history-back")
            deleteCurrentAccount()
        }

        XCTContext.runActivity(named: "Restore the first account, remove its archived route, then delete it") { _ in
            logIn(email: firstEmail, requestPasswordReset: useHealthFixture)
            assertMap(title: "Golden Gate Waterfront")
            app.terminate()
            app.launch()
            assertMap(title: "Golden Gate Waterfront")
            waitForLabel("trip-map-status", useHealthFixture ? "Route complete" : "Step sync is off.")
            openHistory()
            waitForLabel("trip-history-start", "Harlem Meer")
            tap("Remove this trip from history")
            waitForLabel("trip-history-empty", "No trips yet")
            tap("trip-history-back")
            deleteCurrentAccount()
            attach("Welcome after account deletion")
        }
    }

    private func emailForTestAccount(domain: String) -> String {
        "w\(UUID().uuidString.lowercased().prefix(8))@\(domain)"
    }

    private func passOnboarding() {
        let welcome = element("welcome-sign-up")
        let skip = element("onboarding-skip")
        let ready = NSPredicate { _, _ in welcome.exists || skip.exists }
        let expectation = XCTNSPredicateExpectation(predicate: ready, object: nil)
        let result = XCTWaiter.wait(for: [expectation], timeout: 60)
        if result != .completed { attach("Screen at app startup") }
        XCTAssertEqual(result, .completed, "TravelFit did not show onboarding-or-welcome")
        if skip.exists {
            attach("Onboarding")
            skip.tap()
        }
        assertVisible("welcome-sign-up")
    }

    private func register(name: String, email: String) {
        tap("welcome-sign-up")
        assertVisible("sign-up-name")
        attach("Signup form")
        fill("sign-up-name", with: name)
        fill("sign-up-email", with: email)
        fill("sign-up-password", with: password, secure: true)
        tap("sign-up-submit", in: "auth-scroll")
        passwordSavePromptMayAppear = true
        assertVisible("health-skip", waiting: 60)
    }

    private func logIn(email: String, requestPasswordReset: Bool) {
        tap("welcome-log-in")
        if requestPasswordReset {
            tap("log-in-forgot-password", in: "auth-scroll")
            fill("reset-password-email", with: email, dismissKeyboard: true)
            tap("reset-password-submit", in: "auth-scroll")
        }
        fill("log-in-email", with: email)
        fill("log-in-password", with: password, secure: true)
        tap("log-in-submit", in: "auth-scroll")
        passwordSavePromptMayAppear = true
    }

    private func fill(_ identifier: String, with value: String, secure: Bool = false, dismissKeyboard: Bool = false) {
        let field = secure ? app.secureTextFields[identifier] : app.textFields[identifier]
        let found = field.waitForExistence(timeout: timeout)
        if !found { attach("Screen waiting for input \(identifier)") }
        XCTAssertTrue(found, "Missing input \(identifier)")
        reveal(field, in: "auth-scroll")
        field.tap()
        // Give the controlled React Native input time to accept the first key event.
        field.typeText(String(value.prefix(1)))
        field.typeText(String(value.dropFirst()))
        let valueMatches = {
            guard let entered = field.value as? String else { return false }
            return secure ? entered.count == value.count : entered == value
        }
        if !valueMatches() {
            let entered = field.value as? String ?? ""
            if !entered.isEmpty && entered != field.placeholderValue {
                field.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: entered.count))
            }
            for character in value {
                field.typeText(String(character))
            }
        }
        let retained = valueMatches()
        if !retained { attach("Screen with input issue for \(identifier)") }
        XCTAssertTrue(retained, "TravelFit did not retain input for \(identifier)")
        if secure || dismissKeyboard { field.typeText("\n") }
    }

    private func assertMap(title: String) {
        waitForLabel("trip-map-title", title)
        let map = app.maps.firstMatch
        let view = map.exists ? map : assertVisible("trip-map")
        XCTAssertGreaterThan(view.frame.width, 0, "MapKit viewport has no width")
        XCTAssertGreaterThan(view.frame.height, 0, "MapKit viewport has no height")
    }

    private func startFirstRoute(_ identifier: String) {
        tap(identifier, in: "routes-list")
        let button = element(identifier)
        if !element("trip-map-title").waitForExistence(timeout: 6), button.exists && button.isEnabled {
            // An iOS password sheet can consume a tap as it dismisses.
            tap(identifier, in: "routes-list")
        }
    }

    private func assertMapStepCount(_ expected: String) {
        let progress = assertVisible("trip-map-progress").label
        let steps = progress.split(separator: "·").last.map { String($0.filter { $0.isNumber }) }
        XCTAssertEqual(steps, expected, "Unexpected fixture step count: \(progress)")
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
    private func assertVisible(_ identifier: String, waiting: TimeInterval? = nil) -> XCUIElement {
        let view = element(identifier)
        let found = view.waitForExistence(timeout: waiting ?? timeout)
        if !found { attach("Screen waiting for \(identifier)") }
        XCTAssertTrue(found, "TravelFit did not show \(identifier)")
        return view
    }

    private func tap(_ identifier: String, in scrollID: String? = nil) {
        _ = dismissPasswordSavePromptIfPresent()
        let nativeButton = app.buttons.matching(identifier: identifier).firstMatch
        let button = nativeButton.exists ? nativeButton : element(identifier)
        if let scrollID {
            reveal(button, in: scrollID)
        }
        let ready = NSPredicate { _, _ in button.exists && button.isHittable && button.isEnabled }
        func waitForButton() -> XCTWaiter.Result {
            let expectation = XCTNSPredicateExpectation(predicate: ready, object: nil)
            return XCTWaiter.wait(for: [expectation], timeout: timeout)
        }
        var result = waitForButton()
        if result != .completed && dismissPasswordSavePromptIfPresent() {
            result = waitForButton()
        }
        if result != .completed {
            attach("Screen waiting to activate \(identifier)")
            let exists = button.exists
            let hittable = exists && button.isHittable
            let enabled = exists && button.isEnabled
            XCTFail("TravelFit could not activate \(identifier) exists=\(exists) hittable=\(hittable) enabled=\(enabled)")
            return
        }
        button.tap()
    }

    private func dismissPasswordSavePromptIfPresent() -> Bool {
        guard passwordSavePromptMayAppear else { return false }
        // iOS exposes this system sheet's button in TravelFit's accessibility tree.
        let later = app.buttons["Not Now"].firstMatch
        for _ in 0..<2 {
            guard later.exists && later.isHittable else { return false }
            later.tap()
            let gone = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: later)
            if XCTWaiter.wait(for: [gone], timeout: 5) == .completed {
                passwordSavePromptMayAppear = false
                return true
            }
        }
        return false
    }

    private func reveal(_ view: XCUIElement, in scrollID: String) {
        let container = element(scrollID)
        for _ in 0..<5 {
            if view.exists && view.isHittable { return }
            // React Native scroll containers can be exposed as other elements.
            let scrollSurface = container.exists && container.isHittable ? container : app
            scrollSurface.swipeUp()
        }
    }

    private func tapAlertButton(_ title: String, alert: String) {
        let dialog = app.alerts[alert]
        XCTAssertTrue(dialog.waitForExistence(timeout: timeout), "Expected alert \(alert)")
        dialog.buttons[title].tap()
    }

    private func waitForLabel(_ identifier: String, _ label: String, contains: Bool = false) {
        let view = assertVisible(identifier)
        let predicate = NSPredicate(format: contains ? "label CONTAINS %@" : "label == %@", label)
        let expectation = XCTNSPredicateExpectation(predicate: predicate, object: view)
        let result = XCTWaiter.wait(for: [expectation], timeout: timeout)
        if result != .completed { attach("Screen waiting for \(identifier) to display \(label)") }
        XCTAssertEqual(result, .completed, "Expected \(identifier) to display \(label), got \(view.label)")
    }

    private func attach(_ name: String) {
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = name
        screenshot.lifetime = .keepAlways
        add(screenshot)
    }
}
