import moment from 'moment'
import { getCurrentAccountId, getData, storeData } from './database'

const TRIP_HISTORY_KEY = 'trip_history'

const historyWrites = new Map()

const getTripHistory = async (uid, options) => {
  try {
    const trips = JSON.parse(await getData(TRIP_HISTORY_KEY, uid, options))
    return Array.isArray(trips) ? trips : []
  } catch (error) {
    if (options?.strict) throw error
    return []
  }
}

const saveTripHistory = (trips, uid) =>
  storeData(TRIP_HISTORY_KEY, JSON.stringify(trips), uid)

// Starting a route and deleting history both edit the same saved list.
const updateHistory = (uid, update) => {
  const operation = (historyWrites.get(uid) || Promise.resolve()).catch(() => {}).then(async () => {
    if (getCurrentAccountId() !== uid) return
    const history = await getTripHistory(uid, { strict: true })
    if (getCurrentAccountId() !== uid) return
    const updated = update(history)
    await saveTripHistory(updated, uid)
    return updated
  })
  historyWrites.set(uid, operation)
  return operation.finally(() => {
    if (historyWrites.get(uid) === operation) historyWrites.delete(uid)
  })
}

const archiveCurrentTrip = async (settings, uid = getCurrentAccountId()) => {
  if (!uid || !settings?.starting || !settings?.destination) return

  const trip = {
    id: `trip_${settings.tripId || settings.startedTime || Date.now()}`,
    starting: settings.starting,
    destination: settings.destination,
    distance: settings.distance || 0,
    steps: settings.steps || 0,
    startedTime: settings.startedTime,
    completed: settings.completed || null,
    completedDate: settings.completed || moment().toISOString(),
    badges: (settings.badges || []).filter((b) => b && b.progress >= 100).length,
    totalBadges: (settings.badges || []).length,
    cities: (settings.cities || []).length,
    duration: settings.duration || 0
  }

  const updated = await updateHistory(uid, (history) => [trip, ...history.filter(({ id }) => id !== trip.id)])
  return updated ? trip : undefined
}

const deleteTripFromHistory = async (tripId, uid = getCurrentAccountId()) => {
  if (!uid) return
  return updateHistory(uid, (history) => history.filter((trip) => trip.id !== tripId))
}

export { getTripHistory, saveTripHistory, archiveCurrentTrip, deleteTripFromHistory }
