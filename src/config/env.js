// Environment Configuration
// Replace placeholder values with real keys before deploying to production.
// For production, consider using react-native-config to load from .env files.

const ENV = {
  development: {
    STRIPE_PUBLISHABLE_KEY: 'pk_test_your_stripe_publishable_key_here',
    FIREBASE_PROJECT_ID: 'YOUR_PROJECT_ID',
    CLOUD_FUNCTIONS_URL: 'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net',
    GOOGLE_WEB_CLIENT_ID: '10048863785-mv1ommb6ja9djftbnnkrnh5cskd7850p.apps.googleusercontent.com'
  },
  production: {
    STRIPE_PUBLISHABLE_KEY: 'pk_live_your_stripe_publishable_key_here',
    FIREBASE_PROJECT_ID: 'YOUR_PROJECT_ID',
    CLOUD_FUNCTIONS_URL: 'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net',
    GOOGLE_WEB_CLIENT_ID: '10048863785-mv1ommb6ja9djftbnnkrnh5cskd7850p.apps.googleusercontent.com'
  }
}

const getEnv = () => {
  if (__DEV__) return ENV.development
  return ENV.production
}

export default getEnv()
