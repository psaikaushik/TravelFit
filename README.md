# TravelFit - Virtual Travel Fitness App

## Overview
TravelFit is a React Native fitness app that gamifies exercise by letting users virtually travel between real-world locations. Users select a source and destination (e.g., SFO to Seattle), and their daily steps/workouts from Apple Health gradually move them along the route on a map.

## Key Concept
- **Virtual Travel**: Your real workouts translate to virtual distance on a chosen route
- **Apple Health Integration**: Tracks daily steps automatically via Apple HealthKit
- **Progress Visualization**: Shows progress on Google Maps with route polylines and markers
- **Gamification**: City badges, achievements, and progress tracking

## Tech Stack
- React Native 0.70.6
- Firebase (Auth, Database, Analytics, Crashlytics)
- Google Maps API
- Apple HealthKit
- Native Base UI

## App Flow
1. **Video Intro** → Plays intro video automatically
2. **Welcome Screen** → User signup/login
3. **Credit Card** → Secure payment information collection
4. **Subscription Selection** → Choose plan or start free trial
5. **Apple Health** → Connect to Apple Health for step tracking
6. **Trip Setup** → Select source/destination for virtual journey
7. **Main App** → Primary app with bottom tab navigation:
   - Map - Shows route progress on Google Maps
   - Progress - Daily stats and overall journey progress
   - Achievements - Badges and milestones
   - Profile - User settings and account

## Key Files & Components

### Core Application Files
- **App.js** - Main app entry point with NativeBase theme provider
- **index.js** - React Native app registration

### Navigation & Routes
- **src/routes/index.js** - Main app navigation and authentication flow
- **src/routes/Main.js** - Bottom tab navigation for main app screens
- **src/routes/Place.js** - Modal navigation for city details
- **src/routes/PlaceNavigation.js** - Navigation utilities for place modals
- **src/routes/RootNavigation.js** - Root navigation reference

### Main Screens
- **src/screens/VideoIntro.js** - Video intro screen that plays on app launch
- **src/screens/Welcome.js** - Welcome screen with app introduction
- **src/screens/Login.js** - User login screen
- **src/screens/SignUp.js** - User registration screen
- **src/screens/CreditCard.js** - Secure payment information collection
- **src/screens/SubscriptionSelection.js** - Subscription plan selection and free trial
- **src/screens/AppleHealth.js** - Health permission setup and connection
- **src/screens/Trip.js** - Route selection and trip setup
- **src/screens/Map.js** - Route visualization with Google Maps
- **src/screens/Progress.js** - Daily stats and progress tracking
- **src/screens/Achievements.js** - Badges and milestones display
- **src/screens/Profile.js** - User settings and account management
- **src/screens/PlaceModal.js** - Modal for city/place details
- **src/screens/Reset.js** - Password reset screen
- **src/screens/Subscription.js** - Subscription plans and purchase flow

### Services (Business Logic)
- **src/services/helpers.js** - Core business logic:
  - Step to distance conversion (`steps / 12 / 100`)
  - Progress calculations
  - Badge/achievement logic
  - Background progress updates
  - Subscription status checking
- **src/services/background.js** - Apple Health integration and background tasks:
  - Listens for step count updates
  - Triggers progress updates
  - Sends achievement notifications
- **src/services/database.js** - Firebase database operations
- **src/services/maps.js** - Google Maps API integration:
  - Route calculation
  - Place details
  - Geocoding
- **src/services/users.js** - User management and authentication
- **src/services/subscription.js** - In-app purchase management:
  - Subscription purchase handling
  - Product management
  - Purchase restoration

### Components
- **src/components/TabScreen.js** - Base tab screen wrapper
- **src/components/BaseScreen.js** - Base screen component
- **src/components/AuthScreen.js** - Authentication screen wrapper
- **src/components/FormInput.js** - Form input component
- **src/components/SearchableDropdown.js** - Searchable dropdown component
- **src/components/CustomToast.js** - Custom toast notification component

### Theme & Assets
- **src/theme/index.js** - Main theme configuration
- **src/theme/colors.js** - Color palette
- **src/theme/button.js** - Button styles
- **src/theme/text.js** - Text styles
- **src/theme/input.js** - Input styles
- **src/theme/mapStyle.json** - Google Maps custom styling
- **src/assets/icons/** - SVG icons
- **src/assets/images/** - App images

## How to Run the App

### Prerequisites
- Node.js (v14 or higher)
- React Native CLI
- Xcode (for iOS)
- Android Studio (for Android)
- CocoaPods (for iOS dependencies)

### Installation
1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Install iOS dependencies:**
   ```bash
   cd ios && pod install && cd ..
   ```

### Running the App

#### iOS
```bash
npm run ios
# or
npx react-native run-ios
```

#### Android
```bash
npm run android
# or
npx react-native run-android
```

#### Development Server
```bash
npm start
# or
npx react-native start
```

### Additional Commands
- **Run tests:** `npm test`
- **Lint code:** `npm run lint`

## Configuration Required
Before running the app, you'll need to configure:

1. **Firebase Project**:
   - Create a Firebase project
   - Add iOS/Android apps to the project
   - Download and place configuration files:
     - `GoogleService-Info.plist` (iOS)
     - `google-services.json` (Android)

2. **Google Maps API**:
   - Enable Google Maps SDK
   - Enable Places API
   - Enable Directions API
   - Add API key to the project

3. **Apple Health** (iOS only):
   - Health permissions are handled in the app
   - Ensure proper entitlements are set in `ios/TravelFit/TravelFit.entitlements`

## Data Flow
1. User connects Apple Health and selects a route
2. App calculates route using Google Maps Directions API
3. Background service monitors step count from Apple Health
4. Steps are converted to distance and progress is updated
5. When user reaches city breakpoints, badges are awarded
6. Local notifications are sent for achievements
7. Trip is marked complete when virtual distance = route distance

## Key Features
- **Video Intro**: Customizable intro video on app launch
- **Automatic Step Tracking**: Background integration with Apple Health
- **Route Visualization**: Interactive Google Maps with progress indicators
- **Achievement System**: City badges and progress milestones
- **Offline Support**: Local data caching with Firebase
- **Push Notifications**: Achievement alerts and progress updates
- **Premium Subscriptions**: Monthly ($4.99) and Annual ($49.99) plans with premium features

## Customizing the Intro Video

The app includes a video intro screen that plays automatically when users first open the app. Currently, it uses a placeholder video from Google's sample videos.

### To Replace the Video:

1. **Create a videos folder** (if it doesn't exist):
   ```bash
   mkdir -p src/assets/videos
   ```

2. **Add your video file** to the `src/assets/videos/` folder:
   - Supported formats: MP4, MOV, M4V, AVI, FLV, etc.
   - Recommended: MP4 format for best compatibility
   - Example: `src/assets/videos/intro.mp4`

3. **Update the video source** in `src/screens/VideoIntro.js`:
   ```javascript
   // Replace this line:
   source={{
     uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
   }}
   
   // With this:
   source={require('../assets/videos/intro.mp4')}
   ```

4. **Adjust video settings** (optional):
   - **Duration**: Video plays once and automatically navigates to Welcome screen
   - **Resize mode**: Currently set to `"cover"` (fills screen, may crop)
   - **Other options**: `"contain"` (fits entire video), `"stretch"` (fills screen exactly)

### Video Specifications:
- **Resolution**: Recommended 1080p or higher for crisp display
- **Duration**: Keep under 10 seconds for better user experience
- **File size**: Optimize for mobile (keep under 10MB)
- **Format**: MP4 with H.264 codec for best compatibility

### Testing the Video:
After replacing the video, run:
```bash
npm install
cd ios && pod install && cd ..
npm run ios
```

The video will play automatically when the app launches, then navigate to the Welcome screen when finished.

## Subscription Feature

TravelFit includes a premium subscription system with two pricing tiers:

### Pricing Plans
- **Monthly Plan**: $4.99/month
- **Annual Plan**: $49.99/year (17% savings)

### Premium Features
- Unlimited routes and journeys
- Advanced progress analytics
- Custom achievement badges
- Route history and replays
- Priority customer support

### Implementation Details
- **In-App Purchases**: Uses `react-native-iap` library
- **Product IDs**: 
  - Monthly: `travelfit_monthly_subscription`
  - Annual: `travelfit_annual_subscription`
- **Subscription Management**: Automatic renewal, purchase restoration
- **Feature Gating**: Premium features are automatically unlocked for subscribers

### Setup Instructions
See `SUBSCRIPTION_SETUP.md` for detailed App Store Connect configuration steps.

### Stripe & Apple Pay Setup
See `docs/STRIPE_SETUP.md` for detailed Stripe and Apple Pay configuration and testing instructions.

## Payment Flow

TravelFit implements a streamlined payment flow that collects payment information immediately after user registration:

### Flow Overview
1. **User Registration/Login** → User signs up or logs in
2. **Credit Card Collection** → Secure payment information collection
3. **Subscription Selection** → Choose plan or start free trial
4. **Main App** → Access to TravelFit features

### Credit Card Screen Features
- **Stripe Apple Pay Integration**: One-tap payment with Face ID/Touch ID (iOS only)
  - Automatic availability detection using Stripe SDK
  - Secure payment processing with Stripe
  - Support for Visa, Mastercard, and American Express
  - Real-time payment status feedback
  - Production-ready payment infrastructure
- **Credit Card Form**: Manual card entry with real-time validation
- **Smart Detection**: Automatically shows Apple Pay if available
- **Card Number Formatting**: Automatic spacing (1234 5678 9012 3456)
- **Expiry Date**: MM/YY format with automatic slash insertion
- **CVV Validation**: 3-4 digit security code validation
- **Cardholder Name**: Required field for payment processing
- **Dual Payment Options**: Users can choose Apple Pay or credit card

### Subscription Selection Screen
- **Monthly Plan**: $4.99/month with full feature access
- **Annual Plan**: $49.99/year with 17% savings
- **Free Trial**: 7-day trial with all premium features
- **Feature Comparison**: Clear list of included features
- **Continue with Free Plan**: Option to use limited free version

### Implementation Details
- **Form Validation**: Real-time validation using react-hook-form
- **Payment Processing**: Simulated payment processing (integrate with Stripe/PayPal)
- **User State Management**: Tracks payment flow completion
- **Navigation Flow**: Automatic redirection based on payment status

## TestFlight Deployment Guide

### Prerequisites
- Apple Developer Account ($99/year)
- Xcode (latest version)
- App Store Connect access
- Physical iOS device for testing (optional but recommended)

### Initial App Store Connect Setup

1. **Create App in App Store Connect:**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Click the "+" button → "New App"
   - Fill in:
     - **Platforms:** iOS
     - **Name:** TravelFit
     - **Bundle ID:** `com.travelfit.app` (must match your project)
     - **SKU:** `travelfit` (unique identifier)
     - **User Access:** Full Access

2. **Configure Xcode Signing:**
   - Open `ios/TravelFit.xcworkspace` in Xcode
   - Select "TravelFit" project → "TravelFit" target
   - Go to "Signing & Capabilities" tab
   - Check "Automatically manage signing"
   - Select your Team (Apple Developer account)
   - Verify Bundle Identifier matches App Store Connect

### Version Numbering Strategy

iOS uses two version numbers:

- **Marketing Version** (`CFBundleShortVersionString`): User-facing version (e.g., `1.1`, `1.2`, `2.0`)
- **Build Number** (`CURRENT_PROJECT_VERSION`): Internal build number (e.g., `1`, `2`, `3`)

#### When to Update Each:

| Change Type | Marketing Version | Build Number | Example |
|-------------|------------------|--------------|---------|
| Bugfix/minor change | Same | Increment | 1.1 (6 → 7) |
| Minor feature | Increment | Reset/Increment | 1.1 → 1.2 (1) |
| Major release | Increment | Reset/Increment | 1.1 → 2.0 (1) |

### Deployment Process

#### Step 1: Update Version Numbers

**For minor changes (bugfixes, small updates):**
- Keep Marketing Version the same
- Increment Build Number in Xcode:
  - Open Xcode → Project settings → General tab
  - Update "Build" number (e.g., 6 → 7)

**For feature releases:**
- Increment Marketing Version (e.g., 1.1 → 1.2)
- Reset or increment Build Number

#### Step 2: Build and Archive

1. **Clean previous builds:**
   ```bash
   cd ios
   rm -rf build
   find ~/Library/Developer/Xcode/DerivedData -name "*TravelFit*" -exec rm -rf {} + 2>/dev/null || true
   ```

2. **Reinstall pods (if needed):**
   ```bash
   pod install
   ```

3. **Open Xcode:**
   ```bash
   open TravelFit.xcworkspace
   ```

4. **Archive the app:**
   - In Xcode, select "Any iOS Device" as target
   - Go to **Product → Archive**
   - Wait for archive to complete (5-10 minutes)

#### Step 3: Upload to App Store Connect

1. **In Organizer window:**
   - Click "Distribute App"
   - Select "App Store Connect"
   - Click "Upload"
   - Follow prompts (select options, review settings)

2. **Wait for processing:**
   - Initial processing: 5-30 minutes
   - Additional processing for TestFlight: 5-15 minutes

#### Step 4: Configure TestFlight

1. **In App Store Connect:**
   - Go to your app → "TestFlight" tab
   - Wait for build to appear (green checkmark)

2. **Add testers:**
   - **Internal Testers:** Your team members (up to 100)
   - **External Testers:** Anyone with email (up to 10,000)

3. **For External Testers:**
   - Submit for beta review (24-48 hours)
   - Add testers by email address
   - Testers receive email invitation

### Automated Deployment Script

Create a script to automate version bumping and deployment:

```bash
#!/bin/bash
# deploy-testflight.sh

# Update build number
cd ios
CURRENT_BUILD=$(grep -A1 "CURRENT_PROJECT_VERSION" TravelFit.xcodeproj/project.pbxproj | grep -o "[0-9]*" | head -1)
NEW_BUILD=$((CURRENT_BUILD + 1))

# Update build number in project file
sed -i '' "s/CURRENT_PROJECT_VERSION = $CURRENT_BUILD;/CURRENT_PROJECT_VERSION = $NEW_BUILD;/g" TravelFit.xcodeproj/project.pbxproj

echo "Updated build number from $CURRENT_BUILD to $NEW_BUILD"

# Clean and archive
rm -rf build
pod install
open TravelFit.xcworkspace

echo "Xcode opened. Please archive and upload to TestFlight."
```

### Troubleshooting Common Issues

#### Bitcode Error
If you get "contains bitcode" error:
- Hermes is disabled in this project (already configured)
- Bitcode is disabled for all targets (already configured)
- Note: Previous boost library workarounds are no longer needed

#### Build Failures
- Clean derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData`
- Reinstall pods: `cd ios && pod install`
- Check signing configuration in Xcode

#### Upload Failures
- Verify bundle identifier matches App Store Connect
- Ensure version numbers are unique
- Check internet connection during upload

### Testing Checklist

Before deploying to TestFlight:

- [ ] App builds successfully in Release mode
- [ ] All features work on physical device
- [ ] Apple Health integration works
- [ ] Google Maps displays correctly
- [ ] Firebase authentication works
- [ ] Push notifications function
- [ ] No console errors in production build

### Best Practices

1. **Test on Physical Device:** Always test on real device before TestFlight
2. **Incremental Updates:** Use build numbers for minor changes
3. **Version Management:** Keep track of version numbers in project documentation
4. **Beta Testing:** Use internal testers for quick feedback
5. **Release Notes:** Add meaningful release notes in App Store Connect

### Quick Commands Reference

```bash
# Clean and rebuild
cd ios && rm -rf build && pod install

# Open Xcode
open TravelFit.xcworkspace

# Check current version
grep -A1 "CURRENT_PROJECT_VERSION" TravelFit.xcodeproj/project.pbxproj
grep "CFBundleShortVersionString" TravelFit/Info.plist
```