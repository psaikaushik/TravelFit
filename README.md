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
5. Install the Release build on a physical iPhone. Verify signup, returning login, granting and skipping Apple Health, route start, foreground and resumed sync, route completion, account switching, account deletion, and useful crash reports. Check the archive’s required SDK privacy manifests before uploading to internal TestFlight.

Android is a separate release track. Its debug build uses the debug keystore. A signed Release build requires `TRAVELFIT_ANDROID_KEYSTORE`, `TRAVELFIT_ANDROID_STORE_PASSWORD`, `TRAVELFIT_ANDROID_KEY_ALIAS`, and `TRAVELFIT_ANDROID_KEY_PASSWORD`. The native toolchain, Play target SDK, Firebase configuration, and Android step integration still need release verification.

## Payments

The beta is free. The beta Functions codebase deploys account deletion only. The payment screens and checkout endpoints from earlier revisions are outside the beta flow.

The proposed paid rollout uses Stripe-hosted Checkout on the web where storefront rules allow, with StoreKit and Google Play Billing for purchases that require the store’s system. The app should read a server-verified entitlement linked to the Firebase UID. Verify webhook signatures and handle renewals, refunds, expirations, and restoration before activating paid access.

[Stripe iOS guidance](https://support.stripe.com/questions/ios-app-guidelines-for-selling-digital-goods-and-services) · [Apple purchase guidelines](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase) · [Google Play Payments policy](https://support.google.com/googleplay/android-developer/answer/9858738)

Earlier payment setup files describe the pre-beta integration. Use this README for the current beta setup.
