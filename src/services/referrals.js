import database from '@react-native-firebase/database'
import auth from '@react-native-firebase/auth'
import { Share } from 'react-native'
import { redeemReferralServer } from './api'

const getUid = () => auth().currentUser?.uid

const REWARD_DAYS = 7 // Both referrer and invitee get 7 days of premium

// Generate a short, unique referral code for the current user
export const getOrCreateReferralCode = async () => {
  const uid = getUid()
  if (!uid) return null

  // Check if user already has a code
  const snapshot = await database()
    .ref(`referrals/codes_by_user/${uid}`)
    .once('value')

  if (snapshot.exists()) {
    return snapshot.val()
  }

  // Generate a new code: first 4 chars of uid + random 4 chars
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No ambiguous chars (0/O, 1/I/L)
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  // Store the code mapping (both directions)
  const updates = {}
  updates[`referrals/codes_by_user/${uid}`] = code
  updates[`referrals/users_by_code/${code}`] = uid

  await database().ref().update(updates)
  return code
}

// Look up who owns a referral code
export const lookupReferralCode = async (code) => {
  if (!code || code.length < 4) return null

  const normalizedCode = code.toUpperCase().trim()
  const snapshot = await database()
    .ref(`referrals/users_by_code/${normalizedCode}`)
    .once('value')

  if (!snapshot.exists()) return null

  const referrerUid = snapshot.val()
  const uid = getUid()

  // Can't refer yourself
  if (referrerUid === uid) return null

  // Check if this user was already referred
  const existingRef = await database()
    .ref(`referrals/referred_by/${uid}`)
    .once('value')

  if (existingRef.exists()) return { error: 'already_referred' }

  return { referrerUid, code: normalizedCode }
}

// Redeem a referral code — calls server-side Cloud Function for
// atomic validation (prevents double-redemption, self-referral, race conditions)
export const redeemReferralCode = async (code) => {
  const uid = getUid()
  if (!uid) return { success: false, error: 'Not logged in' }

  try {
    const result = await redeemReferralServer(code)
    return {
      success: result.success,
      rewardDays: result.rewardDays,
      referrerName: result.referrerName
    }
  } catch (error) {
    // Map Firebase function errors to user-friendly messages
    const errorCode = error.code || ''
    if (errorCode.includes('not-found')) {
      return { success: false, error: 'Referral code not found' }
    }
    if (errorCode.includes('already-exists')) {
      return { success: false, error: 'You have already used a referral code' }
    }
    if (errorCode.includes('failed-precondition')) {
      return { success: false, error: 'You cannot use your own referral code' }
    }
    return { success: false, error: error.message || 'Failed to redeem code' }
  }
}

// Check if current user has active referral premium
export const hasReferralPremium = async () => {
  const uid = getUid()
  if (!uid) return false

  const snapshot = await database()
    .ref(`referrals/rewards/${uid}/premium`)
    .once('value')

  const reward = snapshot.val()
  if (!reward) return false

  return reward.expiresAt > Date.now()
}

// Get referral premium details (expiry, etc.)
export const getReferralPremiumDetails = async () => {
  const uid = getUid()
  if (!uid) return null

  const snapshot = await database()
    .ref(`referrals/rewards/${uid}/premium`)
    .once('value')

  const reward = snapshot.val()
  if (!reward || reward.expiresAt <= Date.now()) return null

  const msRemaining = reward.expiresAt - Date.now()
  const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000))

  return {
    expiresAt: reward.expiresAt,
    daysRemaining,
    reason: reward.reason,
    grantedAt: reward.grantedAt
  }
}

// Get referral stats for current user
export const getReferralStats = async () => {
  const uid = getUid()
  if (!uid) return { code: null, totalReferrals: 0, totalRewardDays: 0, referrals: [] }

  const [codeSnap, statsSnap, referralsSnap] = await Promise.all([
    database().ref(`referrals/codes_by_user/${uid}`).once('value'),
    database().ref(`referrals/stats/${uid}`).once('value'),
    database().ref(`referrals/successful/${uid}`).once('value')
  ])

  const code = codeSnap.val()
  const stats = statsSnap.val() || {}
  const referralsData = referralsSnap.val() || {}

  const referrals = Object.entries(referralsData).map(([id, v]) => ({
    id,
    inviteeName: v.inviteeName,
    redeemedAt: v.redeemedAt
  }))

  return {
    code,
    totalReferrals: stats.totalReferrals || 0,
    totalRewardDays: stats.totalRewardDays || 0,
    referrals
  }
}

// Share referral code via native share sheet
export const shareReferralCode = async () => {
  const code = await getOrCreateReferralCode()
  if (!code) return

  const userSnapshot = await database()
    .ref(`users/${getUid()}`)
    .once('value')
  const name = userSnapshot.val()?.name || 'Your friend'

  const message =
    `${name} invited you to TravelFit!\n\n` +
    `Use my referral code and we both get a FREE week of Premium:\n\n` +
    `Code: ${code}\n\n` +
    `Race me on virtual routes around the world!\n` +
    `Download TravelFit and enter my code to get started.`

  try {
    await Share.share({ message })
  } catch (error) {
    console.log('Share referral error:', error)
  }
}

// Share referral specifically when inviting to a race
export const shareRaceReferral = async (raceName) => {
  const code = await getOrCreateReferralCode()
  if (!code) return

  const userSnapshot = await database()
    .ref(`users/${getUid()}`)
    .once('value')
  const name = userSnapshot.val()?.name || 'Your friend'

  const message =
    `${name} challenged you to a race on TravelFit!\n\n` +
    `Route: ${raceName}\n\n` +
    `Use my referral code to join and we BOTH get a free week of Premium:\n` +
    `Code: ${code}\n\n` +
    `Download TravelFit and let's race!`

  try {
    await Share.share({ message })
  } catch (error) {
    console.log('Share race referral error:', error)
  }
}

export default {
  getOrCreateReferralCode,
  lookupReferralCode,
  redeemReferralCode,
  hasReferralPremium,
  getReferralPremiumDetails,
  getReferralStats,
  shareReferralCode,
  shareRaceReferral
}
