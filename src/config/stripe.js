// Stripe Configuration
// Keys are loaded from the environment config.
// Replace placeholder values in env.js before production deployment.

import env from './env'

export const STRIPE_CONFIG = {
  publishableKey: env.STRIPE_PUBLISHABLE_KEY,
  merchantIdentifier: 'merchant.com.travelfit.app',
  currencyCode: 'USD',
  countryCode: 'US'
}

// Stripe Price IDs — create these in the Stripe Dashboard under Products
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

export const CLOUD_FUNCTIONS_URL = env.CLOUD_FUNCTIONS_URL

export const getPlacePhotoUrl = (photoReference, maxwidth = 400, maxheight = 400) => {
  return `${CLOUD_FUNCTIONS_URL}/placePhoto?ref=${photoReference}&maxwidth=${maxwidth}&maxheight=${maxheight}`
}
