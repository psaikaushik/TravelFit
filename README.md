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
1. **Welcome Screen** → User signup/login
2. **Apple Health** → Connect to Apple Health for step tracking
3. **Trip Setup** → Select source/destination for virtual journey
4. **Main App** → Primary app with bottom tab navigation:
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
- **src/screens/Welcome.js** - Welcome screen with app introduction
- **src/screens/Login.js** - User login screen
- **src/screens/SignUp.js** - User registration screen
- **src/screens/AppleHealth.js** - Health permission setup and connection
- **src/screens/Trip.js** - Route selection and trip setup
- **src/screens/Map.js** - Route visualization with Google Maps
- **src/screens/Progress.js** - Daily stats and progress tracking
- **src/screens/Achievements.js** - Badges and milestones display
- **src/screens/Profile.js** - User settings and account management
- **src/screens/PlaceModal.js** - Modal for city/place details
- **src/screens/Reset.js** - Password reset screen

### Services (Business Logic)
- **src/services/helpers.js** - Core business logic:
  - Step to distance conversion (`steps / 12 / 100`)
  - Progress calculations
  - Badge/achievement logic
  - Background progress updates
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
- **Automatic Step Tracking**: Background integration with Apple Health
- **Route Visualization**: Interactive Google Maps with progress indicators
- **Achievement System**: City badges and progress milestones
- **Offline Support**: Local data caching with Firebase
- **Push Notifications**: Achievement alerts and progress updates