// Stripe Configuration
// Replace these with your actual Stripe keys

export const STRIPE_CONFIG = {
  // Test keys (for development)
  publishableKey: 'pk_test_your_stripe_publishable_key_here',

  // Production keys (uncomment for production)
  // publishableKey: 'pk_live_your_stripe_publishable_key_here',

  // Apple Pay merchant identifier
  merchantIdentifier: 'merchant.com.travelfit.app',

  // Default currency and country
  currencyCode: 'USD',
  countryCode: 'US'
}

// Stripe Price IDs — create these in the Stripe Dashboard under Products
// These map to your subscription plans
export const STRIPE_PRICES = {
  monthly: {
    id: 'price_monthly_placeholder', // Replace with real Stripe Price ID
    amount: 499,
    label: 'Monthly Plan',
    display: '$4.99',
    period: 'month'
  },
  annual: {
    id: 'price_annual_placeholder', // Replace with real Stripe Price ID
    amount: 4999,
    label: 'Annual Plan',
    display: '$49.99',
    period: 'year',
    savings: 'Save 17%'
  }
}

export const isTestMode = () => {
  return STRIPE_CONFIG.publishableKey.startsWith('pk_test_')
}

// Cloud Functions base URL for photo proxy
// Replace PROJECT_ID with your Firebase project ID
export const CLOUD_FUNCTIONS_URL = 'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net'

export const getPlacePhotoUrl = (photoReference, maxwidth = 400, maxheight = 400) => {
  return `${CLOUD_FUNCTIONS_URL}/placePhoto?ref=${photoReference}&maxwidth=${maxwidth}&maxheight=${maxheight}`
}
