import { getUserSettings, setUserSettings } from './database'
import { getSubscriptionStatus as fetchSubscriptionStatus } from './api'
import { hasReferralPremium } from './referrals'

// Helper function to check if user has active subscription (server-authoritative)
// Also checks for active referral premium rewards
export const hasActiveSubscription = async () => {
  try {
    // Check Stripe subscription first
    const result = await fetchSubscriptionStatus()
    if (result.isSubscribed) return true

    // Check referral premium reward
    const hasReferral = await hasReferralPremium()
    if (hasReferral) return true

    return false
  } catch (error) {
    console.error('Error checking subscription status:', error)
    // Fall back to local cache
    const userSettings = await getUserSettings()
    if (userSettings?.subscription?.isActive) return true

    // Still check referral premium on fallback
    try {
      return await hasReferralPremium()
    } catch (e) {
      return false
    }
  }
}

// Helper function to check if user is in trial period
export const isInTrialPeriod = async () => {
  try {
    const result = await fetchSubscriptionStatus()
    return result.isInTrial || false
  } catch (error) {
    console.error('Error checking trial status:', error)
    return false
  }
}

// Helper function to check if user has completed payment flow
export const hasCompletedPaymentFlow = async () => {
  try {
    const userSettings = await getUserSettings()
    return userSettings?.paymentFlowCompleted || false
  } catch (error) {
    console.error('Error checking payment flow status:', error)
    return false
  }
}

// Helper function to mark payment flow as completed
export const markPaymentFlowCompleted = async () => {
  try {
    const userSettings = (await getUserSettings()) || {}
    await setUserSettings({
      ...userSettings,
      paymentFlowCompleted: true
    })
  } catch (error) {
    console.error('Error marking payment flow completed:', error)
  }
}
