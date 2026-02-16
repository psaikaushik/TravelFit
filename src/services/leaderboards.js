import database from '@react-native-firebase/database'
import auth from '@react-native-firebase/auth'
import moment from 'moment'
import { getFriendsList } from './friends'

const getUid = () => auth().currentUser?.uid

// Get the current week key (e.g., "2026-W07")
const getWeekKey = () => {
  const now = moment()
  return `${now.year()}-W${String(now.isoWeek()).padStart(2, '0')}`
}

// Get the current month key (e.g., "2026-02")
const getMonthKey = () => moment().format('YYYY-MM')

// Update user's leaderboard entry
export const updateLeaderboardEntry = async ({
  steps = 0,
  distance = 0,
  landmarks = 0,
  routes = 0,
  cities = 0
}) => {
  const uid = getUid()
  if (!uid) return

  const userSnapshot = await database().ref(`users/${uid}`).once('value')
  const userData = userSnapshot.val() || {}
  const name = userData.name || 'TravelFit User'

  const entry = {
    name,
    steps,
    distance: parseFloat(distance) || 0,
    landmarks,
    routes,
    cities,
    updatedAt: database.ServerValue.TIMESTAMP
  }

  const weekKey = getWeekKey()
  const monthKey = getMonthKey()

  const updates = {}
  updates[`leaderboards/weekly/${weekKey}/${uid}`] = entry
  updates[`leaderboards/monthly/${monthKey}/${uid}`] = entry
  updates[`leaderboards/alltime/${uid}`] = entry

  await database().ref().update(updates)
}

// Update route-specific leaderboard when user completes a route
export const updateRouteLeaderboard = async ({
  routeKey,
  routeName,
  completionSteps,
  completionDays
}) => {
  const uid = getUid()
  if (!uid) return

  const userSnapshot = await database().ref(`users/${uid}`).once('value')
  const userData = userSnapshot.val() || {}

  await database().ref(`leaderboards/routes/${routeKey}/${uid}`).set({
    name: userData.name || 'User',
    completionSteps,
    completionDays,
    completedAt: database.ServerValue.TIMESTAMP
  })
}

// Get global leaderboard
export const getGlobalLeaderboard = async (period = 'weekly', sortBy = 'steps') => {
  let path
  if (period === 'weekly') {
    path = `leaderboards/weekly/${getWeekKey()}`
  } else if (period === 'monthly') {
    path = `leaderboards/monthly/${getMonthKey()}`
  } else {
    path = 'leaderboards/alltime'
  }

  const snapshot = await database()
    .ref(path)
    .orderByChild(sortBy)
    .limitToLast(50)
    .once('value')

  const data = snapshot.val() || {}
  const uid = getUid()

  const entries = Object.entries(data)
    .map(([id, v]) => ({
      id,
      name: v.name || 'User',
      steps: v.steps || 0,
      distance: v.distance || 0,
      landmarks: v.landmarks || 0,
      routes: v.routes || 0,
      cities: v.cities || 0,
      isMe: id === uid
    }))
    .sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0))
    .map((entry, index) => ({ ...entry, rank: index + 1 }))

  return entries
}

// Get friends leaderboard
export const getFriendsLeaderboard = async (sortBy = 'steps') => {
  const uid = getUid()
  if (!uid) return []

  const friends = await getFriendsList()
  const friendIds = friends.map((f) => f.id)
  friendIds.push(uid) // Include self

  const weekKey = getWeekKey()
  const entries = []

  for (const fId of friendIds) {
    const snapshot = await database()
      .ref(`leaderboards/weekly/${weekKey}/${fId}`)
      .once('value')
    const data = snapshot.val()
    if (data) {
      entries.push({
        id: fId,
        name: data.name || 'User',
        steps: data.steps || 0,
        distance: data.distance || 0,
        landmarks: data.landmarks || 0,
        routes: data.routes || 0,
        cities: data.cities || 0,
        isMe: fId === uid
      })
    }
  }

  return entries
    .sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0))
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

// Get route-specific leaderboard
export const getRouteLeaderboard = async (routeKey) => {
  const snapshot = await database()
    .ref(`leaderboards/routes/${routeKey}`)
    .orderByChild('completionDays')
    .limitToLast(50)
    .once('value')

  const data = snapshot.val() || {}
  const uid = getUid()

  return Object.entries(data)
    .map(([id, v]) => ({
      id,
      name: v.name || 'User',
      completionSteps: v.completionSteps || 0,
      completionDays: v.completionDays || 0,
      completedAt: v.completedAt,
      isMe: id === uid
    }))
    .sort((a, b) => a.completionDays - b.completionDays)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

// Get user's own rank in global leaderboard
export const getMyRank = async (period = 'weekly') => {
  const leaderboard = await getGlobalLeaderboard(period, 'steps')
  const uid = getUid()
  const myEntry = leaderboard.find((e) => e.id === uid)
  return myEntry || { rank: '-', steps: 0, distance: 0 }
}

// Subscribe to leaderboard updates
export const subscribeLeaderboard = (period, callback) => {
  let path
  if (period === 'weekly') {
    path = `leaderboards/weekly/${getWeekKey()}`
  } else if (period === 'monthly') {
    path = `leaderboards/monthly/${getMonthKey()}`
  } else {
    path = 'leaderboards/alltime'
  }

  const ref = database().ref(path)
  const listener = ref.on('value', (snapshot) => {
    const data = snapshot.val() || {}
    const uid = getUid()

    const entries = Object.entries(data)
      .map(([id, v]) => ({
        id,
        name: v.name || 'User',
        steps: v.steps || 0,
        distance: v.distance || 0,
        landmarks: v.landmarks || 0,
        isMe: id === uid
      }))
      .sort((a, b) => b.steps - a.steps)
      .map((entry, index) => ({ ...entry, rank: index + 1 }))

    callback(entries)
  })

  return () => ref.off('value', listener)
}

export default {
  updateLeaderboardEntry,
  updateRouteLeaderboard,
  getGlobalLeaderboard,
  getFriendsLeaderboard,
  getRouteLeaderboard,
  getMyRank,
  subscribeLeaderboard
}
