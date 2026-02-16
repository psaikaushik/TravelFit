import AsyncStorage from '@react-native-async-storage/async-storage'
import moment from 'moment'

const TRIP_HISTORY_KEY = 'trip_history'

const getTripHistory = async () => {
  try {
    const raw = await AsyncStorage.getItem(TRIP_HISTORY_KEY)
    if (!raw || raw === 'null') return []
    return JSON.parse(raw)
  } catch (e) {
    console.log('getTripHistory error:', e)
    return []
  }
}

const saveTripHistory = async (trips) => {
  try {
    await AsyncStorage.setItem(TRIP_HISTORY_KEY, JSON.stringify(trips))
  } catch (e) {
    console.log('saveTripHistory error:', e)
  }
}

const archiveCurrentTrip = async (settings) => {
  if (!settings?.starting || !settings?.destination) return

  const trip = {
    id: `trip_${Date.now()}`,
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

  const history = await getTripHistory()
  history.unshift(trip)
  await saveTripHistory(history)
  return trip
}

const deleteTripFromHistory = async (tripId) => {
  const history = await getTripHistory()
  const updated = history.filter((t) => t.id !== tripId)
  await saveTripHistory(updated)
  return updated
}

export { getTripHistory, saveTripHistory, archiveCurrentTrip, deleteTripFromHistory }
