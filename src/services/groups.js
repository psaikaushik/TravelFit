import database from '@react-native-firebase/database'
import auth from '@react-native-firebase/auth'

const getUid = () => auth().currentUser?.uid

// Create a new walking group
export const createGroup = async ({ name, description }) => {
  const uid = getUid()
  if (!uid) return null

  const userSnapshot = await database().ref(`users/${uid}`).once('value')
  const userData = userSnapshot.val() || {}
  const creatorName = userData.name || 'TravelFit User'

  const groupRef = database().ref('groups').push()
  const groupId = groupRef.key

  const groupData = {
    id: groupId,
    name,
    description: description || '',
    creator: uid,
    creatorName,
    createdAt: database.ServerValue.TIMESTAMP,
    memberCount: 1,
    members: {
      [uid]: {
        name: creatorName,
        role: 'admin',
        joinedAt: database.ServerValue.TIMESTAMP
      }
    }
  }

  const updates = {}
  updates[`groups/${groupId}`] = groupData
  updates[`user_groups/${uid}/${groupId}`] = {
    name,
    role: 'admin',
    joinedAt: database.ServerValue.TIMESTAMP
  }

  await database().ref().update(updates)
  return groupId
}

// Join a group by invite code (groupId)
export const joinGroup = async (groupId) => {
  const uid = getUid()
  if (!uid) return false

  const groupSnapshot = await database().ref(`groups/${groupId}`).once('value')
  const group = groupSnapshot.val()
  if (!group) return false

  const userSnapshot = await database().ref(`users/${uid}`).once('value')
  const userData = userSnapshot.val() || {}
  const memberName = userData.name || 'TravelFit User'

  const updates = {}
  updates[`groups/${groupId}/members/${uid}`] = {
    name: memberName,
    role: 'member',
    joinedAt: database.ServerValue.TIMESTAMP
  }
  updates[`groups/${groupId}/memberCount`] = (group.memberCount || 0) + 1
  updates[`user_groups/${uid}/${groupId}`] = {
    name: group.name,
    role: 'member',
    joinedAt: database.ServerValue.TIMESTAMP
  }

  await database().ref().update(updates)
  return true
}

// Leave a group
export const leaveGroup = async (groupId) => {
  const uid = getUid()
  if (!uid) return

  const groupSnapshot = await database().ref(`groups/${groupId}`).once('value')
  const group = groupSnapshot.val()
  if (!group) return

  const updates = {}
  updates[`groups/${groupId}/members/${uid}`] = null
  updates[`groups/${groupId}/memberCount`] = Math.max((group.memberCount || 1) - 1, 0)
  updates[`user_groups/${uid}/${groupId}`] = null

  await database().ref().update(updates)
}

// Invite a friend to a group
export const inviteToGroup = async (groupId, friendId, friendName) => {
  const uid = getUid()
  if (!uid) return

  const userSnapshot = await database().ref(`users/${uid}`).once('value')
  const userData = userSnapshot.val() || {}
  const fromName = userData.name || 'TravelFit User'

  const groupSnapshot = await database().ref(`groups/${groupId}/name`).once('value')
  const groupName = groupSnapshot.val() || 'Walking Group'

  await database().ref(`group_invites/${friendId}/${groupId}`).set({
    groupId,
    groupName,
    invitedBy: uid,
    invitedByName: fromName,
    timestamp: database.ServerValue.TIMESTAMP
  })
}

// Accept group invite
export const acceptGroupInvite = async (groupId) => {
  const uid = getUid()
  if (!uid) return

  // Remove invite and join group
  await database().ref(`group_invites/${uid}/${groupId}`).remove()
  await joinGroup(groupId)
}

// Decline group invite
export const declineGroupInvite = async (groupId) => {
  const uid = getUid()
  if (!uid) return
  await database().ref(`group_invites/${uid}/${groupId}`).remove()
}

// Get my groups
export const getMyGroups = async () => {
  const uid = getUid()
  if (!uid) return []

  const snapshot = await database().ref(`user_groups/${uid}`).once('value')
  const data = snapshot.val() || {}

  const groups = []
  for (const [id, info] of Object.entries(data)) {
    const groupSnapshot = await database().ref(`groups/${id}`).once('value')
    const group = groupSnapshot.val()
    if (group) {
      groups.push({
        id,
        name: group.name,
        description: group.description,
        memberCount: group.memberCount || 0,
        creator: group.creator,
        creatorName: group.creatorName,
        role: info.role,
        createdAt: group.createdAt
      })
    }
  }

  return groups
}

// Get group details with members
export const getGroupDetails = async (groupId) => {
  const snapshot = await database().ref(`groups/${groupId}`).once('value')
  const group = snapshot.val()
  if (!group) return null

  const members = Object.entries(group.members || {}).map(([id, m]) => ({
    id,
    name: m.name,
    role: m.role,
    joinedAt: m.joinedAt
  }))

  return { ...group, membersList: members }
}

// Get group invites for current user
export const getGroupInvites = async () => {
  const uid = getUid()
  if (!uid) return []

  const snapshot = await database().ref(`group_invites/${uid}`).once('value')
  const data = snapshot.val() || {}

  return Object.entries(data).map(([id, v]) => ({
    groupId: id,
    groupName: v.groupName,
    invitedBy: v.invitedBy,
    invitedByName: v.invitedByName,
    timestamp: v.timestamp
  }))
}

// Subscribe to group updates
export const subscribeGroup = (groupId, callback) => {
  const ref = database().ref(`groups/${groupId}`)
  const listener = ref.on('value', (snapshot) => {
    callback(snapshot.val())
  })
  return () => ref.off('value', listener)
}

// Subscribe to my groups list
export const subscribeMyGroups = (callback) => {
  const uid = getUid()
  if (!uid) return () => {}

  const ref = database().ref(`user_groups/${uid}`)
  const listener = ref.on('value', async (snapshot) => {
    const data = snapshot.val() || {}
    const groups = []
    for (const [id, info] of Object.entries(data)) {
      groups.push({ id, name: info.name, role: info.role })
    }
    callback(groups)
  })

  return () => ref.off('value', listener)
}

// Post a message to group activity feed
export const postGroupActivity = async (groupId, activity) => {
  const uid = getUid()
  if (!uid) return

  const userSnapshot = await database().ref(`users/${uid}`).once('value')
  const userData = userSnapshot.val() || {}

  await database().ref(`group_activity/${groupId}`).push({
    userId: uid,
    userName: userData.name || 'User',
    ...activity,
    timestamp: database.ServerValue.TIMESTAMP
  })
}

// Get group activity feed
export const getGroupActivity = async (groupId, limit = 20) => {
  const snapshot = await database()
    .ref(`group_activity/${groupId}`)
    .orderByChild('timestamp')
    .limitToLast(limit)
    .once('value')

  const data = snapshot.val() || {}
  return Object.entries(data)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
}

export default {
  createGroup,
  joinGroup,
  leaveGroup,
  inviteToGroup,
  acceptGroupInvite,
  declineGroupInvite,
  getMyGroups,
  getGroupDetails,
  getGroupInvites,
  subscribeGroup,
  subscribeMyGroups,
  postGroupActivity,
  getGroupActivity
}
