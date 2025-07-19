// Stripe Configuration
// Replace these with your actual Stripe keys

export const STRIPE_CONFIG = {
  // Test keys (for development)
  publishableKey: 'pk_test_your_stripe_publishable_key_here',
  
  // Production keys (for production)
  // publishableKey: 'pk_live_your_stripe_publishable_key_here',
  
  // Apple Pay merchant identifier
  merchantIdentifier: 'merchant.com.travelfit.app',
  
  // Supported payment methods
  supportedNetworks: ['visa', 'mastercard', 'amex'],
  
  // Merchant capabilities
  merchantCapabilities: ['supports3DS'],
  
  // Default currency and country
  currencyCode: 'USD',
  countryCode: 'US',
  
  // Subscription prices
  prices: {
    monthly: '4.99',
    annual: '49.99'
  }
}

// Helper function to get payment request for Apple Pay
export const getApplePayPaymentRequest = (amount = '4.99', label = 'TravelFit Premium') => ({
  countryCode: STRIPE_CONFIG.countryCode,
  currencyCode: STRIPE_CONFIG.currencyCode,
  supportedNetworks: STRIPE_CONFIG.supportedNetworks,
  merchantCapabilities: STRIPE_CONFIG.merchantCapabilities,
  paymentSummaryItems: [
    {
      label: label,
      amount: amount
    },
    {
      label: 'TravelFit',
      amount: amount
    }
  ]
})

// Helper function to check if we're in test mode
export const isTestMode = () => {
  return STRIPE_CONFIG.publishableKey.startsWith('pk_test_')
} 