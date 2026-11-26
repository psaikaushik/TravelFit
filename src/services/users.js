import { Alert, Platform } from 'react-native'
import database from '@react-native-firebase/database'
import auth from '@react-native-firebase/auth'
import { clearLocalAccountData, getCurrentAccountId, setUserData } from './database'
import { deleteAccount } from './api'
import { checkFlow } from './helpers'
import { clearNotifications } from './notifications'

const isPermissionDenied = (error) => error?.code === 'database/permission-denied'

export const getProfile = async (uid = auth().currentUser.uid) => {
  const snapshot = await database().ref(`users/${uid}`).once('value')
  return snapshot.val()
}

export const setProfile = async (data, uid = auth().currentUser.uid) =>
  database().ref(`users/${uid}`).set(data)

export const finishPendingAccountDeletion = async (uid) => {
  if (!uid || getCurrentAccountId() !== uid) return false

  let marker
  try {
    marker = await database().ref(`account_deletions/${uid}`).once('value')
  } catch (error) {
    if (isPermissionDenied(error)) return false
    throw error
  }
  if (marker.val() !== true || getCurrentAccountId() !== uid) return false

  try {
    await deleteAccount(uid)
  } catch {
    throw Object.assign(new Error('An interrupted deletion is pending.'), { code: 'account/deletion-pending' })
  }

  let localCleared = true
  try {
    await clearLocalAccountData(uid)
  } catch {
    localCleared = false
  }
  if (getCurrentAccountId() === uid) await auth().signOut()
  if (!getCurrentAccountId()) {
    if (Platform.OS === 'ios') {
      try {
        clearNotifications()
      } catch {
        localCleared = false
      }
    }
    Alert.alert('Account deleted', localCleared
      ? 'TravelFit finished deleting your account.'
      : 'TravelFit deleted your account. Removing the app clears any remaining local data.')
  }
  return true
}

// An interrupted signup can leave a Firebase Auth user without a profile.
export const cacheAccountProfile = async (user, name = user.displayName) => {
  let profile
  try {
    profile = await getProfile(user.uid)
    if (!profile?.name) {
      profile = {
        name: name?.trim() || 'TravelFit Walker',
        email: user.email || profile?.email || '',
        createdTime: profile?.createdTime || user.metadata?.creationTime || new Date().toISOString()
      }
      await setProfile(profile, user.uid)
    }
  } catch (error) {
    if (isPermissionDenied(error) && await finishPendingAccountDeletion(user.uid)) return null
    throw error
  }
  await setUserData(profile, user.uid)
  return profile
}

export const getAccountEntryRoute = async (user, name) => {
  if (await cacheAccountProfile(user, name) === null) {
    return getCurrentAccountId() ? null : 'Welcome'
  }
  const route = await checkFlow(user)
  return getCurrentAccountId() === user.uid ? route : null
}

export const updateProfile = async (data) =>
  database().ref(`users/${auth().currentUser.uid}`).update(data)

export default { getProfile, setProfile, updateProfile }
