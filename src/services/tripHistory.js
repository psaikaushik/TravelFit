import moment from 'moment'
import { getCurrentAccountId, getData, storeData } from './database'

const TRIP_HISTORY_KEY = 'trip_history'

const getTripHistory = async (uid) => {
  try {
    const trips = JSON.parse(await getData(TRIP_HISTORY_KEY, uid))
    return Array.isArray(trips) ? trips : []
  } catch (e) {
    console.log('getTripHistory error:', e)
    return []
  }
}

const saveTripHistory = async (trips, uid) => {
  try {
    await storeData(TRIP_HISTORY_KEY, JSON.stringify(trips), uid)
  } catch (e) {
    console.log('saveTripHistory error:', e)
  }
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
    badges: (settings.badges || []).filter((b) => b && b.progress > 0).length,
    totalBadges: (settings.badges || []).length,
    cities: (settings.cities || []).length,
    duration: settings.duration || 0
  }

  const history = await getTripHistory(uid)
  const updated = [trip, ...history.filter(({ id }) => id !== trip.id)]
  await storeData(TRIP_HISTORY_KEY, JSON.stringify(updated), uid)
  return trip
}

const deleteTripFromHistory = async (tripId) => {
  const uid = getCurrentAccountId()
  if (!uid) return []

  const history = await getTripHistory(uid)
  const updated = history.filter((t) => t.id !== tripId)
  await saveTripHistory(updated, uid)
  return updated
}

export { getTripHistory, saveTripHistory, archiveCurrentTrip, deleteTripFromHistory }
