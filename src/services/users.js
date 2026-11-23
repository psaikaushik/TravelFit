import database from '@react-native-firebase/database'
import auth from '@react-native-firebase/auth'
import { setUserData } from './database'

export const getProfile = async (uid = auth().currentUser.uid) => {
  const snapshot = await database().ref(`users/${uid}`).once('value')
  return snapshot.val()
}

export const setProfile = async (data, uid = auth().currentUser.uid) =>
  database().ref(`users/${uid}`).set(data)

// An interrupted signup can leave a Firebase Auth user without a profile.
export const cacheAccountProfile = async (user, name = user.displayName) => {
  let profile = await getProfile(user.uid)
  if (!profile?.name) {
    profile = {
      name: name?.trim() || profile?.name || 'TravelFit Walker',
      email: user.email || profile?.email || '',
      createdTime: profile?.createdTime || user.metadata?.creationTime || new Date().toISOString()
    }
    await setProfile(profile, user.uid)
  }
  await setUserData(profile, user.uid)
  return profile
}

export const updateProfile = async (data) =>
  database().ref(`users/${auth().currentUser.uid}`).update(data)

export default { getProfile, setProfile, updateProfile }
