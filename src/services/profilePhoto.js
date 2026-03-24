import { Platform } from 'react-native'
import auth from '@react-native-firebase/auth'
import database from '@react-native-firebase/database'
import logger from '../utils/logger'

// Profile photo service
// Supports picking from library and taking new photos
// Stores the photo URL in Firebase user profile

export const updateProfilePhoto = async (photoUri) => {
  try {
    const uid = auth().currentUser?.uid
    if (!uid) throw new Error('Not authenticated')

    // Store photo reference in Firebase Database
    await database()
      .ref(`users/${uid}/profilePhoto`)
      .set(photoUri)

    return { success: true, uri: photoUri }
  } catch (error) {
    logger.error('updateProfilePhoto error:', error)
    throw error
  }
}

export const getProfilePhoto = async () => {
  try {
    const uid = auth().currentUser?.uid
    if (!uid) return null

    const snapshot = await database()
      .ref(`users/${uid}/profilePhoto`)
      .once('value')

    return snapshot.val()
  } catch (error) {
    logger.error('getProfilePhoto error:', error)
    return null
  }
}

export const removeProfilePhoto = async () => {
  try {
    const uid = auth().currentUser?.uid
    if (!uid) throw new Error('Not authenticated')

    await database()
      .ref(`users/${uid}/profilePhoto`)
      .remove()

    return { success: true }
  } catch (error) {
    logger.error('removeProfilePhoto error:', error)
    throw error
  }
}
