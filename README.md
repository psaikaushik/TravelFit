# TravelFit

TravelFit turns steps from Apple Health into progress on a virtual route. The iOS beta includes a selection of routes, landmarks, achievements, trip history, and daily step goals. Routes use bundled virtual waypoints displayed with MapKit. They represent an in-app journey and are unsuitable for real-world navigation.

## Install and verify the JavaScript app

Use the Node version in `.node-version` and the npm version in `package.json`.

```sh
npm ci
npm run lint
npm test -- --runInBand
npm run bundle:ios -- --bundle-output /tmp/travelfit.jsbundle --assets-dest /tmp/travelfit-assets
```

The GitHub Actions run on `release/fitness-recovery` also builds the unsigned Release app on an iOS 26 simulator. XCUITest drives two demo accounts through signup, Apple Health Skip and reconnect, route selection and completion, trip history, relaunch, and account deletion. The CI checkout uses local Firebase emulators and a Health fixture that supplies 1,200 steps on connection and 20,000 steps after the app resumes. The tracked app entry point used for signed builds stays separate from the fixture. XCTest results and screenshots are uploaded to the workflow run.

To run that same check directly on a Mac, use Xcode 26 with the iOS 26 simulator runtime, the repository's Node and Ruby versions, Bundler, and Java 21. Apple silicon requires Rosetta and a universal iOS simulator runtime that exposes an `x86_64` destination in Xcode.

```sh
bash scripts/run-local-ios-simulator-e2e.sh
```

The command builds committed `HEAD` in a scratch checkout, creates a temporary simulator, and reports the directory containing logs, XCTest results, and screenshots. It uses synthetic accounts and Health samples with loopback Firebase emulators.

To run the backend customer-flow check with Node 22 and Java 21, use the Firebase Local Emulator Suite. This test creates demo users, verifies profile isolation, resets an account password, calls account deletion, and checks that the deleted account no longer works.

```sh
npm ci --prefix functions --engine-strict
npx --yes firebase-tools@15.37.0 emulators:exec --project demo-travelfit-audit --only auth,database,functions 'node scripts/verify-firebase.cjs'
```

## Set up the internal iOS beta

1. Create a separate Firebase project for beta testing with Firebase Authentication, Realtime Database, and Cloud Functions. Enable email/password authentication and configure Sign in with Apple if it will be used. Register the iOS app as `com.travelfit.app`. Use test accounts and avoid importing existing data.
2. Enable Realtime Database, then download the iOS Firebase configuration to `ios/GoogleService-Info.local.plist`. The Xcode build checks the bundle ID, database URL, and staging project. The local plist is ignored by Git.
3. Install the Functions dependencies with `npm ci --prefix functions`. Review the explicit staging project ID before deploying. Use the current Firebase CLI with access to that project.

   ```sh
   firebase deploy --only database,functions:beta --project YOUR_STAGING_PROJECT_ID
   ```

   The Functions deployment requires Node.js 22 support, billing enabled in the Firebase project, and permission for the function to delete Firebase Auth users and access the default database. UIDs marked for deletion stay blocked from profile access while an interrupted deletion is retried.
4. On macOS with Xcode 26 or later and the Ruby version in `.ruby-version`, install the locked CocoaPods dependencies.

   ```sh
   bundle install
   (cd ios && bundle exec pod install --deployment)
   ```

   Open `ios/TravelFit.xcworkspace`, configure the Apple signing team, and verify HealthKit and Sign in with Apple in the signed Release archive. Use a test device without an existing production installation of the same bundle ID.
5. Install the Release build from Xcode, or run `bash scripts/install-ios-device.sh DEVICE_UDID` from a Mac with the staging plist, pinned tools, and Apple signing configured. Running the script without an ID lists Xcode destinations. Verify signup, returning login, granting and skipping Apple Health, route start, foreground and resumed sync, route completion, account switching, and account deletion. Check the archive’s required SDK privacy manifests before uploading to internal TestFlight. Use TestFlight crash reports and beta feedback for diagnostics.

Before a public App Store submission, publish the privacy policy at a verified public HTTPS URL and add a monitored contact to the in-app and public policies. Review the App Privacy answers against the signed archive and its SDK privacy report. If Firebase Crashlytics collection is enabled later, verify delivery in staging and update the data disclosures before distributing that build.

Android is a separate release track. Its debug build uses the debug keystore. A signed Release build requires `TRAVELFIT_ANDROID_KEYSTORE`, `TRAVELFIT_ANDROID_STORE_PASSWORD`, `TRAVELFIT_ANDROID_KEY_ALIAS`, and `TRAVELFIT_ANDROID_KEY_PASSWORD`. The native toolchain, Play target SDK, Firebase configuration, and Android step integration still need release verification.

## Release sign-off on iPhone

Run this on the same signed candidate testers will receive, against Firebase staging. Use a fresh install and a returning install, and record the build number and device/OS for each run.

On a paired Mac, use a dedicated test iPhone with Developer Mode enabled and no production TravelFit installation. Set up Apple Development signing for the app and XCUITest runner, select an authorized Firebase staging project, and save its iOS configuration as described above. Start from a signed-out TravelFit installation or a fresh test phone.

```sh
TRAVELFIT_STAGING_PROJECT_ID=your-staging-project bash scripts/run-ios-device-e2e.sh DEVICE_UDID
```

The script builds the checkout's committed `HEAD` in a temporary directory, checks the Firebase configuration inside the signed build, and runs the physical-device lifecycle test. It creates and deletes two synthetic accounts, keeps Health sync off, and saves the Xcode result bundle and logs to the reported path. Password-reset email, Apple sign-in, real HealthKit samples, and background step delivery have separate release checks.

Run the same signature, capabilities, and bundled privacy manifest checks on the signed archive before validating it in App Store Connect.

```sh
python3 scripts/verify-ios-release.py path/to/TravelFit.xcarchive
```

| Customer flow | Expected behavior |
|---|---|
| Cold start, onboarding, welcome and privacy | Splash clears. Next and Skip reach Welcome. Privacy opens before sign-in and returns correctly. Check large text and VoiceOver on the smallest supported iPhone. |
| Email signup and login | Create an account, sign out, sign back in, and resume the same route. Try incorrect credentials, a duplicate email, and offline recovery. |
| Apple sign-in | Verify first sign-in, returning sign-in, and cancellation on a physical device. |
| Password reset | Request a link, complete the email reset, and sign in with the new password. Verify offline errors and neutral confirmation. |
| Apple Health | Test grant, skip, and revoke. Skipping still lets the user preview a route. Restore access and refresh without returning to onboarding. |
| Routes and landmarks | Start each route, open a landmark, refresh after walking, background and resume, and finish a route. Start another route and verify the previous one remains in history and the new one starts at zero. Cancel a route switch and confirm progress is retained. |
| Progress, achievements and stats | Check badges against actual unlocked landmarks, daily goals before and after completion, and 7- and 30-day totals against known samples. |
| History and notifications | Delete a prior trip. Enable milestone alerts, verify delivery and quiet hours, then disable alerts. Check offline empty states and errors. |
| Sign-out and deletion | Sign out and sign into a second account without seeing the first account's trips or notifications. Delete staged email and Apple accounts, including a stale session retry, and verify profile and authentication removal. |

The JavaScript suite covers the registered fitness entry point, auth screen actions, route changes, and selected walking cases. Run the full checklist on a physical iPhone with staging.

## Payments

The beta is free. The beta Functions codebase deploys account deletion only. The payment screens and checkout endpoints from earlier revisions are outside the beta flow.

The proposed paid rollout uses Stripe-hosted Checkout on the web where storefront rules allow, with StoreKit and Google Play Billing for purchases that require the store’s system. The app should read a server-verified entitlement linked to the Firebase UID. Verify webhook signatures and handle renewals, refunds, expirations, and restoration before activating paid access.

[Stripe iOS guidance](https://support.stripe.com/questions/ios-app-guidelines-for-selling-digital-goods-and-services) · [Apple purchase guidelines](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase) · [Google Play Payments policy](https://support.google.com/googleplay/android-developer/answer/9858738)

Earlier payment setup files describe the pre-beta integration. Use this README for the current beta setup.
