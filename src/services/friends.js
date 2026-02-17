import database from '@react-native-firebase/database'
import auth from '@react-native-firebase/auth'

const getUid = () => auth().currentUser?.uid

// Send a friend request
export const sendFriendRequest = async (toUserId, toUserName) => {
  const uid = getUid()
  if (!uid || uid === toUserId) return

  const userSnapshot = await database().ref(`users/${uid}`).once('value')
  const userData = userSnapshot.val() || {}
  const fromName = userData.name || 'TravelFit User'

  const updates = {}
  // Add to recipient's incoming requests
  updates[`friend_requests/${toUserId}/${uid}`] = {
    fromUid: uid,
    fromName,
    timestamp: database.ServerValue.TIMESTAMP
  }
  // Track outgoing request on sender side
  updates[`friends/${uid}/${toUserId}`] = {
    status: 'pending_sent',
    name: toUserName,
    timestamp: database.ServerValue.TIMESTAMP
  }
  updates[`friends/${toUserId}/${uid}`] = {
    status: 'pending_received',
    name: fromName,
    timestamp: database.ServerValue.TIMESTAMP
  }

  await database().ref().update(updates)
}

// Accept a friend request
export const acceptFriendRequest = async (fromUserId) => {
  const uid = getUid()
  if (!uid) return

  const requestSnapshot = await database()
    .ref(`friend_requests/${uid}/${fromUserId}`)
    .once('value')
  const request = requestSnapshot.val()
  if (!request) return

  const userSnapshot = await database().ref(`users/${uid}`).once('value')
  const userData = userSnapshot.val() || {}
  const myName = userData.name || 'TravelFit User'

  const updates = {}
  // Update both sides to accepted
  updates[`friends/${uid}/${fromUserId}`] = {
    status: 'accepted',
    name: request.fromName,
    timestamp: database.ServerValue.TIMESTAMP
  }
  updates[`friends/${fromUserId}/${uid}`] = {
    status: 'accepted',
    name: myName,
    timestamp: database.ServerValue.TIMESTAMP
  }
  // Remove the friend request
  updates[`friend_requests/${uid}/${fromUserId}`] = null

  await database().ref().update(updates)
}

// Decline a friend request
export const declineFriendRequest = async (fromUserId) => {
  const uid = getUid()
  if (!uid) return

  const updates = {}
  updates[`friend_requests/${uid}/${fromUserId}`] = null
  updates[`friends/${uid}/${fromUserId}`] = null
  updates[`friends/${fromUserId}/${uid}`] = null

  await database().ref().update(updates)
}

// Remove a friend
export const removeFriend = async (friendId) => {
  const uid = getUid()
  if (!uid) return

  const updates = {}
  updates[`friends/${uid}/${friendId}`] = null
  updates[`friends/${friendId}/${uid}`] = null

  await database().ref().update(updates)
}

// Get friends list (accepted only)
export const getFriendsList = async () => {
  const uid = getUid()
  if (!uid) return []

  const snapshot = await database().ref(`friends/${uid}`).once('value')
  const data = snapshot.val() || {}

  return Object.entries(data)
    .filter(([_, v]) => v.status === 'accepted')
    .map(([id, v]) => ({ id, name: v.name, timestamp: v.timestamp }))
}

// Get pending friend requests (incoming)
export const getFriendRequests = async () => {
  const uid = getUid()
  if (!uid) return []

  const snapshot = await database().ref(`friend_requests/${uid}`).once('value')
  const data = snapshot.val() || {}

  return Object.entries(data).map(([id, v]) => ({
    id,
    fromUid: v.fromUid,
    fromName: v.fromName,
    timestamp: v.timestamp
  }))
}

// Search users by name (basic search)
export const searchUsers = async (query) => {
  if (!query || query.length < 2) return []

  const snapshot = await database()
    .ref('users')
    .orderByChild('name')
    .startAt(query)
    .endAt(query + '\uf8ff')
    .limitToFirst(20)
    .once('value')

  const data = snapshot.val() || {}
  const uid = getUid()

  return Object.entries(data)
    .filter(([id]) => id !== uid)
    .map(([id, v]) => ({ id, name: v.name || 'User' }))
}

// Listen to friends list in real-time
export const subscribeFriends = (callback) => {
  const uid = getUid()
  if (!uid) return () => {}

  const ref = database().ref(`friends/${uid}`)
  const listener = ref.on('value', (snapshot) => {
    const data = snapshot.val() || {}
    const friends = Object.entries(data)
      .filter(([_, v]) => v.status === 'accepted')
      .map(([id, v]) => ({ id, name: v.name, timestamp: v.timestamp }))
    callback(friends)
  })

  return () => ref.off('value', listener)
}

// Listen to friend requests in real-time
export const subscribeFriendRequests = (callback) => {
  const uid = getUid()
  if (!uid) return () => {}

  const ref = database().ref(`friend_requests/${uid}`)
  const listener = ref.on('value', (snapshot) => {
    const data = snapshot.val() || {}
    const requests = Object.entries(data).map(([id, v]) => ({
      id,
      fromUid: v.fromUid,
      fromName: v.fromName,
      timestamp: v.timestamp
    }))
    callback(requests)
  })

  return () => ref.off('value', listener)
}

// Get friend's current progress for leaderboard/race context
export const getFriendProgress = async (friendId) => {
  const snapshot = await database()
    .ref(`user_progress/${friendId}`)
    .once('value')
  return snapshot.val()
}

// Update own progress in Firebase (for friends to see)
export const updateMyProgress = async (progressData) => {
  const uid = getUid()
  if (!uid) return

  await database().ref(`user_progress/${uid}`).update({
    ...progressData,
    updatedAt: database.ServerValue.TIMESTAMP
  })
}

export default {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  getFriendsList,
  getFriendRequests,
  searchUsers,
  subscribeFriends,
  subscribeFriendRequests,
  getFriendProgress,
  updateMyProgress
}
