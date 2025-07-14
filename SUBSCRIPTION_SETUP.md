# TravelFit Subscription Setup Guide

## Current Status: Development Mode

The app is currently running in **Development Mode** because the subscription products haven't been configured in App Store Connect yet. This means:

- ✅ The payment flow works (credit card collection → subscription selection)
- ✅ Users can select plans and see pricing
- ✅ The app uses fallback pricing when products aren't available
- ⚠️ "Invalid Product ID" errors will occur until products are configured
- ⚠️ Real purchases won't work until App Store Connect is set up

## Quick Fix for "Invalid Product ID" Error

The "Invalid Product ID" error occurs because the app is trying to fetch products that don't exist in App Store Connect yet. The app now handles this gracefully by:

1. **Showing a development mode notice** on the subscription screen
2. **Using fallback pricing** when products aren't available
3. **Simulating purchases** for testing purposes
4. **Providing clear error messages** about missing products

## Product Configuration Required

To enable real subscriptions, you need to configure these products in App Store Connect:

### Product IDs
- **Monthly**: `travelfit_monthly_subscription` ($4.99/month)
- **Annual**: `travelfit_annual_subscription` ($49.99/year)

### Setup Steps
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your TravelFit app
3. Go to **Features** → **In-App Purchases**
4. Click **+** to create new products
5. Configure each product with the exact Product IDs above
6. Set pricing and subscription details
7. Submit for review

## Development vs Production

### Development Mode (Current)
- Products not configured in App Store Connect
- App shows fallback pricing
- Purchases are simulated for testing
- Development mode notice is displayed

### Production Mode (After Setup)
- Products configured in App Store Connect
- Real pricing from App Store
- Actual purchases and billing
- No development mode notice

## Testing the Payment Flow

Even in development mode, you can test the complete payment flow:

1. **Sign up/Login** → Goes to Credit Card screen
2. **Enter credit card info** → Goes to Subscription Selection
3. **Select a plan** → Shows development mode notice
4. **Click "Test Subscription"** → Simulates successful purchase
5. **Navigate to main app** → Payment flow completed

## Next Steps

1. **Test the current flow** to ensure everything works
2. **Configure products in App Store Connect** (see detailed steps below)
3. **Test with real products** once configured
4. **Submit for App Store review** when ready

---

## Detailed App Store Connect Setup

### Step 1: Create In-App Purchase Products

1. **Access App Store Connect:**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Select your TravelFit app

2. **Navigate to In-App Purchases:**
   - Click **Features** in the left sidebar
   - Select **In-App Purchases**

3. **Create Monthly Subscription:**
   - Click the **+** button
   - Select **Auto-Renewable Subscription**
   - Product ID: `travelfit_monthly_subscription`
   - Reference Name: `TravelFit Monthly Subscription`
   - Subscription Group: Create new group "TravelFit Subscriptions"
   - Subscription Duration: 1 Month
   - Price: $4.99 USD

4. **Create Annual Subscription:**
   - Click the **+** button again
   - Select **Auto-Renewable Subscription**
   - Product ID: `travelfit_annual_subscription`
   - Reference Name: `TravelFit Annual Subscription`
   - Subscription Group: Use same group "TravelFit Subscriptions"
   - Subscription Duration: 1 Year
   - Price: $49.99 USD

### Step 2: Configure Subscription Details

For each subscription:

1. **Localization:**
   - Display Name: "TravelFit Monthly" / "TravelFit Annual"
   - Description: "Full access to all TravelFit premium features"

2. **Pricing:**
   - Set appropriate pricing for your target markets
   - Consider regional pricing variations

3. **Review Information:**
   - Add clear descriptions for App Store review
   - Explain what features are included

### Step 3: Submit for Review

1. **Complete all required fields**
2. **Add review information**
3. **Submit for review**
4. **Wait for approval** (typically 24-48 hours)

### Step 4: Test in Production

Once approved:

1. **Build and upload a new version** to TestFlight
2. **Test with real products** using sandbox accounts
3. **Verify pricing and purchase flow**
4. **Test subscription restoration**

## Troubleshooting

### "Invalid Product ID" Error
- **Cause**: Products not configured in App Store Connect
- **Solution**: Follow the setup steps above
- **Workaround**: App now handles this gracefully in development mode

### Products Not Loading
- **Check**: Product IDs match exactly (case-sensitive)
- **Verify**: Products are approved in App Store Connect
- **Test**: Use sandbox accounts for testing

### Purchase Failures
- **Development**: Use sandbox accounts
- **Production**: Ensure products are live and approved
- **Testing**: Test on physical devices, not simulators

## Sandbox Testing

For testing real purchases:

1. **Create Sandbox Accounts:**
   - Go to App Store Connect → Users and Access
   - Create sandbox tester accounts
   - Use these accounts on test devices

2. **Test Devices:**
   - Sign out of regular Apple ID
   - Sign in with sandbox account
   - Test purchases (no real charges)

3. **Test Scenarios:**
   - New subscription purchase
   - Subscription renewal
   - Subscription cancellation
   - Purchase restoration

## Security Considerations

- **Never hardcode API keys** in the app
- **Use App Store receipts** for server-side validation
- **Implement proper receipt validation** on your backend
- **Handle edge cases** like network failures, cancellations

## Revenue Optimization

- **A/B Test Pricing**: Test different price points
- **Promotional Offers**: Use App Store promotional pricing
- **Subscription Groups**: Plan for multiple subscription tiers
- **Analytics**: Track conversion rates and churn

## Support Resources

- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [In-App Purchase Programming Guide](https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/StoreKitGuide/Introduction.html)
- [React Native IAP Documentation](https://github.com/dooboolab/react-native-iap) 