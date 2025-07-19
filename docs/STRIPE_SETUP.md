# Stripe Setup Guide for TravelFit

This guide will help you set up Stripe payments including Apple Pay for the TravelFit app.

## Prerequisites

- Stripe account (free to create)
- Apple Developer Account (for Apple Pay)
- iOS App ID configured

## Step 1: Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create a new account or sign in
3. Complete account verification
4. Note your publishable keys (test and live)

## Step 2: Configure Stripe Keys

1. **Get your publishable keys:**
   - Go to Stripe Dashboard → Developers → API keys
   - Copy your **Publishable key** (starts with `pk_test_` for test, `pk_live_` for production)

2. **Update the configuration:**
   - Open `src/config/stripe.js`
   - Replace `pk_test_your_stripe_publishable_key_here` with your actual test key
   - For production, uncomment and use the live key

## Step 3: Apple Pay Setup

### Apple Developer Portal Configuration

1. **Create Merchant ID:**
   - Go to [Apple Developer Portal](https://developer.apple.com/account/)
   - Navigate to **Certificates, Identifiers & Profiles**
   - Select **Identifiers** → **+** → **Merchant IDs**
   - Create merchant ID: `merchant.com.travelfit.app`

2. **Configure App ID:**
   - Go to **Identifiers** → Your App ID
   - Enable **Apple Pay** capability
   - Add your merchant ID to the configuration

### Xcode Configuration

1. **Add Apple Pay Capability:**
   - Open Xcode → TravelFit project
   - Select target → **Signing & Capabilities**
   - Click **+ Capability** → **Apple Pay**
   - Add merchant ID: `merchant.com.travelfit.app`

2. **Update Info.plist (if needed):**
   - Add `NSApplePayUsageDescription` key
   - Value: "TravelFit uses Apple Pay for secure payments"

## Step 4: Test Apple Pay

### Simulator Testing

1. **Enable Apple Pay in Simulator:**
   - Open iOS Simulator
   - Go to **Features** → **Apple Pay**
   - Add test cards (Visa, Mastercard, Amex)

2. **Test the App:**
   - Run the app on simulator
   - Navigate to Credit Card screen
   - Tap "Pay with Apple Pay"
   - Complete the payment flow

### Device Testing

1. **Set up Apple Pay on Device:**
   - Add real payment methods to Apple Pay
   - Ensure device supports Apple Pay

2. **Test Payment Flow:**
   - Run app on device
   - Test Apple Pay functionality
   - Verify payment processing

## Step 5: Backend Integration (Production)

For production, you'll need a backend server to:

1. **Create Payment Intents:**
   ```javascript
   // Server-side (Node.js example)
   const paymentIntent = await stripe.paymentIntents.create({
     amount: 499, // $4.99 in cents
     currency: 'usd',
     payment_method_types: ['card', 'apple_pay'],
   });
   ```

2. **Handle Apple Pay Confirmation:**
   ```javascript
   // In your React Native app
   const { error } = await confirmApplePayPayment(paymentIntent.client_secret);
   ```

## Step 6: Production Deployment

1. **Switch to Live Keys:**
   - Update `src/config/stripe.js` with live publishable key
   - Ensure backend uses live secret key

2. **Test with Real Cards:**
   - Use Stripe's test cards for final testing
   - Verify Apple Pay works with real devices

3. **Monitor Payments:**
   - Use Stripe Dashboard to monitor transactions
   - Set up webhooks for payment events

## Current Implementation

The app includes:

- ✅ **Stripe Provider Setup** - Wraps the entire app
- ✅ **Apple Pay Detection** - Checks device compatibility
- ✅ **Payment Request Configuration** - Proper Apple Pay setup
- ✅ **Error Handling** - User cancellation and failures
- ✅ **Payment Flow Integration** - Seamless navigation

## Configuration Files

### `src/config/stripe.js`
- Centralized Stripe configuration
- Easy switching between test/production
- Helper functions for Apple Pay

### `App.js`
- StripeProvider wrapper
- Publishable key configuration

### `src/screens/CreditCard.js`
- Apple Pay integration
- Payment processing logic
- User feedback and error handling

## Testing Checklist

- [ ] Apple Pay appears on iOS devices
- [ ] Payment sheet opens correctly
- [ ] Payment completion works
- [ ] Error handling for cancellations
- [ ] Navigation to subscription screen
- [ ] Test with different card types
- [ ] Verify in Stripe Dashboard

## Troubleshooting

### Common Issues

1. **"Apple Pay not available"**
   - Check device supports Apple Pay
   - Verify merchant ID in Xcode
   - Ensure Apple Pay is set up on device

2. **"Payment failed"**
   - Check Stripe keys are correct
   - Verify network connectivity
   - Check Stripe Dashboard for errors

3. **Build errors**
   - Clean and rebuild: `cd ios && pod install`
   - Check all dependencies are installed
   - Verify Xcode capabilities are set

### Debug Information

The app logs payment events:
- Apple Pay availability checks
- Payment request creation
- Payment completion/failure
- Error details

## Next Steps

1. **Backend Integration** - Implement server-side payment processing
2. **Webhook Setup** - Handle payment events
3. **Subscription Management** - Integrate with Stripe subscriptions
4. **Analytics** - Track payment success rates
5. **Security** - Implement proper token handling

## Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe React Native SDK](https://github.com/stripe/stripe-react-native)
- [Apple Pay Developer Guide](https://developer.apple.com/apple-pay/)
- [Stripe Support](https://support.stripe.com/)

## Security Notes

- Never expose secret keys in client code
- Always use publishable keys in React Native
- Implement proper server-side validation
- Use webhooks for payment confirmation
- Follow PCI compliance guidelines 