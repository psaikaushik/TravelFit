import AppleHealthKit from 'react-native-health'
import { Platform } from 'react-native'
import moment from 'moment'
import { getCurrentAccountId, getUserData, getUserSettings, setUserSettings } from './database'
import {
  getCityDetails,
  getLocationDetails,
  getPlaceDetails
} from './maps'
import { hasActiveSubscription } from './subscription'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const calcSteps = (steps = 0) => {
  return (Math.round(steps / 12) / 100).toFixed(2)
}

export const getDestinationStep = (idx, route) => {
  if (idx < 0 || !route || route.length === 0) return null
  return route.slice(0, idx + 1)
}

export const prettifyNum = (num = 0) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export const printK = (num = 0) => {
  if (num >= 1000000) return `${num / 1000000}M`
  if (num >= 1000) return `${num / 1000}K`
  return `${num}`
}

export const stepsToDistance = (steps = 0) => {
  return prettifyNum(calcSteps(steps))
}

export const calcProgress = (steps = 0, distance = 1) => {
  if (!(distance > 0)) return 0
  return Math.max(0, Math.min((calcSteps(steps) / distance) * 100, 100))
}

export const calcRemaining = (steps = 0, distance = 1) => {
  return prettifyNum(Math.max(distance - calcSteps(steps), 0).toFixed(2))
}

export const calcDistance = (start, end) => {
  const radians = (value) => value * Math.PI / 180
  const latitude = radians(end.latitude - start.latitude)
  const longitude = radians(end.longitude - start.longitude)
  const a = Math.sin(latitude / 2) ** 2 + Math.sin(longitude / 2) ** 2 *
    Math.cos(radians(start.latitude)) * Math.cos(radians(end.latitude))
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(1 - a, 0)))
}

export const getTripProgressIndex = (steps, distance, route) => {
  if (!route?.length) return -1

  const fraction = calcProgress(steps, distance) / 100
  if (fraction === 0) return 0
  if (fraction === 1) return route.length - 1

  const distances = [0]
  for (let i = 1; i < route.length; i++) {
    distances.push(distances[i - 1] + calcDistance(route[i - 1], route[i]))
  }
  const traveled = distances[distances.length - 1] * fraction
  const nextPoint = distances.findIndex((value) => value > traveled)
  return nextPoint < 0 ? 0 : nextPoint - 1
}

export const getStepsNumAtDate = async (
  date = moment().startOf('day').toISOString(),
  uid = getCurrentAccountId()
) => {
  if (Platform.OS !== 'ios' || !uid || !AppleHealthKit?.getDailyStepCountSamples) return null
  const settings = await getUserSettings(uid)
  if (!settings.health || getCurrentAccountId() !== uid) return null

  // HealthKit intentionally hides read authorization. An empty result can mean
  // either that Health has no samples for this interval or that access is off.
  return new Promise((resolve) => {
    AppleHealthKit.getDailyStepCountSamples(
      { startDate: date },
      (error, samples) => resolve(
        !error && getCurrentAccountId() === uid && Array.isArray(samples) ? samples : null
      )
    )
  })
}

export const getStats = async () => {
  const stats = [
    { id: 'today', date: moment().startOf('day').toISOString() },
    { id: 'yesterday', date: moment().subtract(1, 'days').startOf('day').toISOString() },
    { id: 'OneDayBefore', date: moment().subtract(2, 'days').startOf('day').toISOString() },
    { id: 'TwoDaysBefore', date: moment().subtract(3, 'days').startOf('day').toISOString() },
    { id: 'ThreeDaysBefore', date: moment().subtract(4, 'days').startOf('day').toISOString() }
  ]
  const results = (await getStepsNumAtDate(stats[4].date)) || []

  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i]
    const totalSteps = results
      .filter((x) => moment(stat.date).isSame(x.startDate, 'day'))
      .reduce((sum, item) => sum + item.value, 0)
    stats[i] = { ...stats[i], steps: totalSteps }
  }
  return stats
}

const getPolygonArray = (latitude) => {
  const R = 6378137
  const pi = 3.14
  //distance in meters
  const upper_offset = 300
  const lower_offset = -300

  const lat_up = upper_offset / R
  const lat_down = lower_offset / R

  //OffsetPosition, decimal degrees
  const lat_upper = latitude + (lat_up * 180) / pi
  const lat_lower = latitude + (lat_down * 180) / pi

  return [lat_upper, lat_lower]
}

export const getPolygonPoints = (waypoints) => {
  let polyLength = waypoints.length
  let upperBound = []
  let lowerBound = []
  for (let j = 0; j <= polyLength - 1; j++) {
    let newPoints = getPolygonArray(waypoints[j][0])
    upperBound.push({ latitude: newPoints[0], longitude: waypoints[j][1] })
    lowerBound.push({ latitude: newPoints[1], longitude: waypoints[j][1] })
  }
  let reverseBound = lowerBound.reverse()
  return upperBound.concat(reverseBound)
}

export const printGrid = (places) => {
  const arr = []
  for (let i = 0; i < places.length; i += 2) {
    arr.push(places.slice(i, i + 2))
  }
  return arr
}

export const getTopPlace = (places) => {
  // console.log('places', places.map((x) => x.name).join(', '))
  places.forEach((place) => {
    place.score =
      (place.types || []).length * 10 +
      (place.user_ratings_total || 0) +
      (place.rating || 0) * 20 +
      (place.photos || []).length * 15
  })
  return places.sort((a, b) => b.score - a.score)[0]
}

export const getZoom = (distance = 0) => {
  if (distance === 0) return {}
  if (distance > 2000) return { latitudeDelta: 0.001, longitudeDelta: 43 }
  if (distance > 1400) return { latitudeDelta: 0.001, longitudeDelta: 25 }
  if (distance > 900) return { latitudeDelta: 0.001, longitudeDelta: 15 }
  if (distance > 600) return { latitudeDelta: 0.001, longitudeDelta: 9 }
  if (distance > 300) return { latitudeDelta: 0.001, longitudeDelta: 8 }
  if (distance > 150) return { latitudeDelta: 0.001, longitudeDelta: 3 }
  if (distance > 100) return { latitudeDelta: 0.001, longitudeDelta: 1.4 }
  if (distance > 50) return { latitudeDelta: 0.001, longitudeDelta: 0.8 }
  if (distance > 10) return { latitudeDelta: 0.001, longitudeDelta: 0.75 }
  if (distance > 5) return { latitudeDelta: 0.001, longitudeDelta: 0.25 }
  return { latitudeDelta: 0.001, longitudeDelta: 0.08 }
}

export const getRadius = (distance) => {
  if (distance > 600) return Math.round(distance / 35)
  if (distance > 300) return Math.round(distance / 30)
  if (distance > 150) return Math.round(distance / 25)
  if (distance > 100) return Math.round(distance / 20)
  if (distance > 50) return Math.round(distance / 12)
  if (distance > 10) return Math.round(distance / 5)
  return (distance / 10).toFixed(1)
}

export const calcBreakpointsProgress = (
  progressIdx,
  destinationPoint,
  route,
  breakPoints,
  badges,
  radius
) => {
  const newBadges = [...badges]

  breakPoints.forEach((item, index) => {
    let progress = 0
    const pointIdx = route.findIndex(
      (x) =>
        !!x && x.latitude === item.latitude && x.longitude === item.longitude
    )
    const distance = calcDistance(destinationPoint, item).toFixed(1)
    if (distance === '0.0') {
      if (index === breakPoints.length - 1) {
        progress = 100
      } else {
        progress = 50
      }
    } else if (distance < radius) {
      // Inside break point
      if (pointIdx > progressIdx) {
        progress = ((radius - distance) / radius) * 100
      } else {
        progress = (distance / radius) * 100
      }
    } else {
      if (pointIdx < progressIdx) {
        // Already Passed
        progress = 100
      } else {
        // Not Passed
        progress = 0
      }
    }
    if (!!newBadges[index]) {
      newBadges[index].progress = progress
    }
  })
  return newBadges
}

export const checkCity = async (destinationPoint, oldCities = []) => {
  if (!destinationPoint) return []
  const data = await getLocationDetails(destinationPoint)
  for (const result of data?.results || []) {
    const components = result.address_components || []
    const findComponent = (type) => components.find(({ types }) => types?.includes(type))
    const locality = findComponent('locality') || findComponent('administrative_area_level_2')
    if (!locality?.long_name) continue

    const name = [
      locality.long_name,
      findComponent('administrative_area_level_1')?.long_name,
      findComponent('country')?.short_name
    ].filter(Boolean).join(', ')
    if (oldCities.some((city) => city.name === name)) return []

    const details = await getCityDetails(name)
    const prediction = details?.predictions?.[0]
    if (!prediction || oldCities.some((city) => city.place_id === prediction.place_id)) return []

    const place = await getPlaceDetails(prediction.place_id)
    return [{ place_id: prediction.place_id, name, photos: place?.result?.photos || [] }]
  }
  return []
}

export const hasActiveTrip = (settings) => !!settings?.curatedRouteId &&
  settings.route?.length > 0 && settings.distance > 0 && Array.isArray(settings.badges)

const syncTrip = async (uid, queryClient) => {
  const settings = (await getUserSettings(uid)) || {}
  if (Platform.OS !== 'ios' || !settings.health) return { status: 'off' }
  if (!hasActiveTrip(settings)) return { status: 'no-trip' }
  if (settings.completed) return { status: 'complete' }

  const { createdTime } = (await getUserData(uid)) || {}
  const start = settings.startedTime || createdTime || moment().startOf('day').toISOString()
  const samples = await getStepsNumAtDate(start, uid)
  if (!samples) return { status: 'unavailable' }
  if (samples.length === 0) return { status: 'empty' }

  const { steps = 0, distance, badges } = settings
  const totalSteps = samples.reduce((sum, item) => sum + (Number(item?.value) || 0), 0)
  // Health access can be restricted to recent records. Keep recorded trip progress
  // when a partial query returns fewer steps, and rebase only when the trip resets.
  if (totalSteps <= steps) return { status: 'ready' }

  const traveled = Math.min(Number(calcSteps(totalSteps)), distance)
  const newBadges = badges.map((badge) => ({
    ...badge,
    progress: Math.min(traveled / badge.distance * 100, 100)
  }))
  const alerts = newBadges.filter((badge, index) => badge.progress === 100 && badges[index].progress < 100)

  const current = await getUserSettings(uid)
  if (getCurrentAccountId() !== uid || !current?.health || current.completed ||
      current.tripId !== settings.tripId || current.startedTime !== settings.startedTime) {
    return { status: 'no-trip' }
  }

  const completed = traveled === distance
  await setUserSettings({
    ...current,
    steps: totalSteps,
    badges: newBadges,
    completed: completed ? moment().toISOString() : undefined
  }, uid)

  await Promise.all([
    queryClient?.invalidateQueries(['settings']),
    queryClient?.invalidateQueries(['stats'])
  ])

  return { status: completed ? 'complete' : 'ready', alerts }
}

const progressSyncs = new Map()

export const updateProgress = (queryClient) => {
  const uid = getCurrentAccountId()
  if (!uid) return Promise.resolve({ status: 'off' })
  if (!progressSyncs.has(uid)) {
    const sync = syncTrip(uid, queryClient)
      .catch(() => ({ status: 'unavailable' }))
      .finally(() => progressSyncs.delete(uid))
    progressSyncs.set(uid, sync)
  }
  return progressSyncs.get(uid)
}

export const checkFlow = async (user) => {
  if (!user) {
    const onboardingDone = await AsyncStorage.getItem('onboarding_completed')
    return onboardingDone ? 'Welcome' : 'Onboarding'
  }

  const settings = (await getUserSettings(user.uid)) || {}
  if (Platform.OS === 'ios' && !settings.healthSetupCompleted && !settings.health) {
    return 'AppleHealth'
  }
  return hasActiveTrip(settings) ? 'Main' : 'Trip'
}

export const checkSubscriptionStatus = async () => {
  try {
    return await hasActiveSubscription()
  } catch (error) {
    console.error('Failed to check subscription status:', error)
    return false
  }
}

export const isFeatureAvailable = async (feature) => {
  const isSubscribed = await checkSubscriptionStatus()

  // Define which features require subscription
  const premiumFeatures = [
    'unlimited_routes',
    'advanced_analytics',
    'custom_badges',
    'route_history',
    'priority_support'
  ]

  return !premiumFeatures.includes(feature) || isSubscribed
}

export default {
  getTopPlace,
  getPolygonPoints,
  stepsToDistance,
  calcProgress,
  prettifyNum,
  calcRemaining
}
