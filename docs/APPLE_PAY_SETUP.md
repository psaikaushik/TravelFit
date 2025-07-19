# Apple Pay Setup Guide for TravelFit

This guide will help you set up Apple Pay for the TravelFit app.

## Prerequisites

- Apple Developer Account
- iOS App ID configured
- Xcode project set up

## Step 1: Configure Apple Pay in Apple Developer Portal

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Select **Identifiers** from the left sidebar
4. Find your app's App ID or create a new one
5. Click on the App ID to edit it
6. Scroll down to **Capabilities** section
7. Check the box for **Apple Pay**
8. Click **Configure** next to Apple Pay
9. Add your merchant ID (see Step 2)
10. Click **Save**

## Step 2: Create Merchant ID

1. In the Apple Developer Portal, go to **Certificates, Identifiers & Profiles**
2. Select **Identifiers** from the left sidebar
3. Click the **+** button to create a new identifier
4. Select **Merchant IDs** and click **Continue**
5. Enter a description (e.g., "TravelFit Merchant ID")
6. Enter a unique identifier (e.g., `merchant.com.travelfit.app`)
7. Click **Continue** and then **Register**

## Step 3: Configure Xcode Project

1. Open your Xcode project
2. Select your project in the navigator
3. Select your app target
4. Go to **Signing & Capabilities** tab
5. Click **+ Capability**
6. Add **Apple Pay**
7. In the Apple Pay section, add your merchant ID: `merchant.com.travelfit.app`

## Step 4: Update App Configuration

The app is already configured to use Apple Pay with the following settings:

- **Merchant ID**: `merchant.com.travelfit.app`
- **Supported Networks**: Visa, Mastercard, American Express
- **Merchant Capabilities**: 3D Secure
- **Country Code**: US
- **Currency Code**: USD

## Step 5: Test Apple Pay

### Simulator Testing
1. Open iOS Simulator
2. Go to **Features** > **Apple Pay**
3. Add a test card
4. Run the app and test Apple Pay functionality

### Device Testing
1. Ensure you have a device with Apple Pay set up
2. Add a real payment method to Apple Pay
3. Test the payment flow on the device

## Step 6: Production Setup

For production, you'll need to:

1. **Payment Processor Integration**: Integrate with a payment processor like Stripe, Square, or Adyen
2. **Backend Processing**: Set up server-side payment processing
3. **Security**: Implement proper token handling and validation
4. **Testing**: Test with real payment methods

## Current Implementation

The app currently includes:

- Apple Pay availability detection
- Payment request configuration
- Error handling for user cancellation and failures
- Integration with the app's payment flow

## Troubleshooting

### Common Issues

1. **"Apple Pay not available"**
   - Ensure Apple Pay is enabled in device settings
   - Check that the device supports Apple Pay
   - Verify merchant ID is correctly configured

2. **"Payment failed"**
   - Check network connectivity
   - Verify payment method is valid
   - Ensure merchant ID matches Apple Developer Portal

3. **Build errors**
   - Clean and rebuild the project
   - Ensure all pods are installed: `cd ios && pod install`
   - Check that Apple Pay capability is added in Xcode

### Debug Information

The app logs Apple Pay events to the console:
- Payment success/failure
- Availability checks
- Error details

## Next Steps

1. Integrate with a payment processor
2. Add server-side payment validation
3. Implement subscription management
4. Add payment analytics and monitoring

## Support

For issues with Apple Pay integration, check:
- [Apple Pay Developer Documentation](https://developer.apple.com/apple-pay/)
- [React Native Apple Pay Package](https://github.com/naoufal/react-native-apple-pay)
- [Apple Developer Forums](https://developer.apple.com/forums/) 