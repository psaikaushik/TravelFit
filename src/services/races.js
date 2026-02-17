import database from '@react-native-firebase/database'
import auth from '@react-native-firebase/auth'
import { getUserSettings } from './database'
import { calcSteps } from './helpers'

const getUid = () => auth().currentUser?.uid

// Create a new route race
export const createRace = async ({
  routeName,
  starting,
  destination,
  distance,
  groupId = null
}) => {
  const uid = getUid()
  if (!uid) return null

  const userSnapshot = await database().ref(`users/${uid}`).once('value')
  const userData = userSnapshot.val() || {}
  const creatorName = userData.name || 'TravelFit User'

  const raceRef = database().ref('races').push()
  const raceId = raceRef.key

  const raceData = {
    id: raceId,
    routeName: routeName || `${starting?.title || 'Start'} → ${destination?.title || 'End'}`,
    starting: {
      title: starting?.title || 'Start',
      coordinate: starting?.coordinate || null
    },
    destination: {
      title: destination?.title || 'Destination',
      coordinate: destination?.coordinate || null
    },
    distance,
    creator: uid,
    creatorName,
    groupId,
    status: 'waiting', // waiting | active | completed
    maxParticipants: 10,
    createdAt: database.ServerValue.TIMESTAMP,
    startedAt: null,
    participants: {
      [uid]: {
        name: creatorName,
        steps: 0,
        progress: 0,
        distance: 0,
        joinedAt: database.ServerValue.TIMESTAMP,
        lastUpdated: database.ServerValue.TIMESTAMP
      }
    }
  }

  const updates = {}
  updates[`races/${raceId}`] = raceData
  updates[`user_races/${uid}/${raceId}`] = {
    routeName: raceData.routeName,
    status: 'waiting',
    createdAt: database.ServerValue.TIMESTAMP
  }

  await database().ref().update(updates)
  return raceId
}

// Join an existing race
export const joinRace = async (raceId) => {
  const uid = getUid()
  if (!uid) return false

  const raceSnapshot = await database().ref(`races/${raceId}`).once('value')
  const race = raceSnapshot.val()
  if (!race || race.status === 'completed') return false

  const participantCount = Object.keys(race.participants || {}).length
  if (participantCount >= (race.maxParticipants || 10)) return false
  if (race.participants?.[uid]) return false // already joined

  const userSnapshot = await database().ref(`users/${uid}`).once('value')
  const userData = userSnapshot.val() || {}
  const userName = userData.name || 'TravelFit User'

  const updates = {}
  updates[`races/${raceId}/participants/${uid}`] = {
    name: userName,
    steps: 0,
    progress: 0,
    distance: 0,
    joinedAt: database.ServerValue.TIMESTAMP,
    lastUpdated: database.ServerValue.TIMESTAMP
  }
  updates[`user_races/${uid}/${raceId}`] = {
    routeName: race.routeName,
    status: race.status,
    createdAt: race.createdAt
  }

  await database().ref().update(updates)
  return true
}

// Start a race (creator only)
export const startRace = async (raceId) => {
  const uid = getUid()
  if (!uid) return false

  const raceSnapshot = await database().ref(`races/${raceId}`).once('value')
  const race = raceSnapshot.val()
  if (!race || race.creator !== uid || race.status !== 'waiting') return false

  await database().ref(`races/${raceId}`).update({
    status: 'active',
    startedAt: database.ServerValue.TIMESTAMP
  })

  // Update status for all participants
  const participants = Object.keys(race.participants || {})
  const updates = {}
  participants.forEach((pId) => {
    updates[`user_races/${pId}/${raceId}/status`] = 'active'
  })
  await database().ref().update(updates)

  return true
}

// Update your progress in a race
export const updateRaceProgress = async (raceId) => {
  const uid = getUid()
  if (!uid) return

  const raceSnapshot = await database().ref(`races/${raceId}`).once('value')
  const race = raceSnapshot.val()
  if (!race || race.status !== 'active') return

  // Get current user settings for step count
  const settings = await getUserSettings()
  if (!settings) return

  const totalSteps = settings.steps || 0
  const raceDistance = race.distance || 1

  // Calculate how far along this race the user is
  const distanceWalked = parseFloat(calcSteps(totalSteps))
  const progress = Math.min((distanceWalked / raceDistance) * 100, 100)

  await database().ref(`races/${raceId}/participants/${uid}`).update({
    steps: totalSteps,
    progress,
    distance: distanceWalked,
    lastUpdated: database.ServerValue.TIMESTAMP
  })

  // Check if race is complete for this participant
  if (progress >= 100) {
    await database().ref(`races/${raceId}/participants/${uid}/finishedAt`).set(
      database.ServerValue.TIMESTAMP
    )

    // Check if all participants finished
    const updatedRace = await database().ref(`races/${raceId}`).once('value')
    const updatedData = updatedRace.val()
    const allFinished = Object.values(updatedData.participants || {}).every(
      (p) => p.progress >= 100
    )

    if (allFinished) {
      await database().ref(`races/${raceId}/status`).set('completed')
      const pIds = Object.keys(updatedData.participants || {})
      const statusUpdates = {}
      pIds.forEach((pId) => {
        statusUpdates[`user_races/${pId}/${raceId}/status`] = 'completed'
      })
      await database().ref().update(statusUpdates)
    }
  }
}

// Leave a race
export const leaveRace = async (raceId) => {
  const uid = getUid()
  if (!uid) return

  const updates = {}
  updates[`races/${raceId}/participants/${uid}`] = null
  updates[`user_races/${uid}/${raceId}`] = null

  await database().ref().update(updates)
}

// Get my active races
export const getMyRaces = async () => {
  const uid = getUid()
  if (!uid) return []

  const snapshot = await database().ref(`user_races/${uid}`).once('value')
  const data = snapshot.val() || {}

  const races = []
  for (const [id, info] of Object.entries(data)) {
    const raceSnapshot = await database().ref(`races/${id}`).once('value')
    const race = raceSnapshot.val()
    if (race) {
      const participants = Object.entries(race.participants || {}).map(
        ([pId, p]) => ({
          id: pId,
          name: p.name,
          steps: p.steps || 0,
          progress: p.progress || 0,
          distance: p.distance || 0,
          finishedAt: p.finishedAt || null
        })
      )
      // Sort by progress descending
      participants.sort((a, b) => b.progress - a.progress)

      races.push({
        id,
        routeName: race.routeName,
        distance: race.distance,
        status: race.status,
        creator: race.creator,
        creatorName: race.creatorName,
        createdAt: race.createdAt,
        startedAt: race.startedAt,
        starting: race.starting,
        destination: race.destination,
        participantCount: participants.length,
        participants,
        myProgress: participants.find((p) => p.id === uid)?.progress || 0
      })
    }
  }

  return races.sort((a, b) => {
    const statusOrder = { active: 0, waiting: 1, completed: 2 }
    return (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3)
  })
}

// Get race details with live participants
export const getRaceDetails = async (raceId) => {
  const snapshot = await database().ref(`races/${raceId}`).once('value')
  const race = snapshot.val()
  if (!race) return null

  const participants = Object.entries(race.participants || {})
    .map(([id, p]) => ({
      id,
      name: p.name,
      steps: p.steps || 0,
      progress: p.progress || 0,
      distance: p.distance || 0,
      finishedAt: p.finishedAt || null,
      lastUpdated: p.lastUpdated
    }))
    .sort((a, b) => b.progress - a.progress)

  return { ...race, participantsList: participants }
}

// Subscribe to race updates in real-time
export const subscribeRace = (raceId, callback) => {
  const ref = database().ref(`races/${raceId}`)
  const listener = ref.on('value', (snapshot) => {
    const race = snapshot.val()
    if (!race) return callback(null)

    const participants = Object.entries(race.participants || {})
      .map(([id, p]) => ({
        id,
        name: p.name,
        steps: p.steps || 0,
        progress: p.progress || 0,
        distance: p.distance || 0,
        finishedAt: p.finishedAt || null,
        lastUpdated: p.lastUpdated
      }))
      .sort((a, b) => b.progress - a.progress)

    callback({ ...race, participantsList: participants })
  })

  return () => ref.off('value', listener)
}

// Get public/joinable races
export const getOpenRaces = async () => {
  const snapshot = await database()
    .ref('races')
    .orderByChild('status')
    .equalTo('waiting')
    .limitToFirst(20)
    .once('value')

  const data = snapshot.val() || {}
  const uid = getUid()

  return Object.entries(data)
    .map(([id, race]) => ({
      id,
      routeName: race.routeName,
      distance: race.distance,
      creatorName: race.creatorName,
      participantCount: Object.keys(race.participants || {}).length,
      maxParticipants: race.maxParticipants || 10,
      isJoined: !!(race.participants || {})[uid],
      createdAt: race.createdAt
    }))
    .filter((r) => !r.isJoined)
}

// Invite friend to a race
export const inviteToRace = async (raceId, friendId) => {
  const uid = getUid()
  if (!uid) return

  const raceSnapshot = await database().ref(`races/${raceId}`).once('value')
  const race = raceSnapshot.val()
  if (!race) return

  const userSnapshot = await database().ref(`users/${uid}`).once('value')
  const userData = userSnapshot.val() || {}

  await database().ref(`race_invites/${friendId}/${raceId}`).set({
    raceId,
    routeName: race.routeName,
    invitedBy: uid,
    invitedByName: userData.name || 'Friend',
    distance: race.distance,
    timestamp: database.ServerValue.TIMESTAMP
  })
}

// Get race invites
export const getRaceInvites = async () => {
  const uid = getUid()
  if (!uid) return []

  const snapshot = await database().ref(`race_invites/${uid}`).once('value')
  const data = snapshot.val() || {}

  return Object.entries(data).map(([id, v]) => ({
    raceId: id,
    routeName: v.routeName,
    invitedBy: v.invitedBy,
    invitedByName: v.invitedByName,
    distance: v.distance,
    timestamp: v.timestamp
  }))
}

// Accept race invite
export const acceptRaceInvite = async (raceId) => {
  const uid = getUid()
  if (!uid) return
  await database().ref(`race_invites/${uid}/${raceId}`).remove()
  return joinRace(raceId)
}

export default {
  createRace,
  joinRace,
  startRace,
  updateRaceProgress,
  leaveRace,
  getMyRaces,
  getRaceDetails,
  subscribeRace,
  getOpenRaces,
  inviteToRace,
  getRaceInvites,
  acceptRaceInvite
}
