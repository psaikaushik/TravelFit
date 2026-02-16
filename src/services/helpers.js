import AppleHealthKit from 'react-native-health'
import moment from 'moment'
import { getUserData, getUserSettings, setUserSettings } from './database'
import {
  calcDistance,
  getCityDetails,
  getLocationDetails,
  getPlaceDetails
} from './maps'
import { hasCompletedPaymentFlow } from './subscription'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const calcSteps = (steps = 0) => {
  return (Math.round(steps / 12) / 100).toFixed(2)
}

export const getDestinationStep = (idx, route) => {
  if (idx < 0 || !route || route.length === 0) return null
  if (idx >= route.length - 1) return route
  return route.slice(0, idx)
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
  return (calcSteps(steps) / distance) * 100
}

export const calcRemaining = (steps = 0, distance = 1) => {
  return prettifyNum((((distance - calcSteps(steps)) * 100) / 100).toFixed(2))
}

export const getStepsNumAtDate = async (date = null) =>
  new Promise((resolve, reject) => {
    AppleHealthKit.getDailyStepCountSamples(
      {
        startDate: date
      },
      (callbackError, results) => {
        if (callbackError) {
          console.log('getStepsNum Error', callbackError)
          resolve(callbackError)
        } else {
          resolve(results)
        }
      }
    )
  })

export const getStepsNum = async (date = null) =>
  new Promise((resolve, reject) => {
    AppleHealthKit.getAuthStatus(
      {
        permissions: {
          read: [AppleHealthKit.Constants.Permissions.StepCount],
          write: []
        }
      },
      async (error, result) => {
        console.log('getAuthStatus', error, result)
        if (
          !!error ||
          !result ||
          (result?.permissions?.read || []).length === 0
        ) {
          resolve(error)
        } else if (result.permissions.read[0] !== 1) {
          resolve('notAllowed')
        } else {
          AppleHealthKit.getDailyStepCountSamples(
            {
              startDate: date
            },
            (callbackError, results) => {
              if (callbackError) {
                console.log('getStepsNum Error', callbackError)
                resolve(callbackError)
              } else {
                console.log('getDailyStepCountSamples results', results.length)
                resolve(results)
              }
            }
          )
        }
      }
    )
  })

export const getStats = async () => {
  const stats = [
    { id: 'today', date: moment().toISOString() },
    { id: 'yesterday', date: moment().subtract(1, 'days').toISOString() },
    { id: 'OneDayBefore', date: moment().subtract(2, 'days').toISOString() },
    { id: 'TwoDaysBefore', date: moment().subtract(3, 'days').toISOString() },
    { id: 'ThreeDaysBefore', date: moment().subtract(4, 'days').toISOString() }
  ]
  const results = await getStepsNumAtDate(stats[4].date)
  console.log('results', results)
  if (!results) return stats

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
      place.photos.length * 15
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
  console.log('checkCity', destinationPoint)
  const newCities = []
  if (!destinationPoint) return newCities
  const data = await getLocationDetails(destinationPoint)
  const { results } = data || {}
  let city = null
  for (let r = 0; r < (results || []).length; r++) {
    const { address_components } = results[r]
    for (let t = 0; t < address_components.length; t++) {
      const address = address_components[t]
      const types = address.types || []
      if (types.find((x) => x === 'locality')) {
        city = { name: address.long_name }
      }
      if (
        !city?.name &&
        types.find((x) => x === 'administrative_area_level_2')
      ) {
        city = { name: address.long_name }
      }
      if (types.find((x) => x === 'administrative_area_level_1')) {
        city.state = address.long_name
      }
      if (types.find((x) => x === 'country')) {
        city.country = address.short_name
      }
    }
    if (!!city) break
  }

  if (!city?.name) return newCities
  const cityName = `${city.name}, ${city.state || ''}, ${city.country || ''}`
  const details = await getCityDetails(city.name)
  const prediction =
    (details?.predictions || []).length > 0 ? details.predictions[0] : null
  if (!prediction) return newCities
  const place = await getPlaceDetails(prediction.place_id)

  if (!!city && !oldCities.find((x) => x.place_id === prediction.place_id)) {
    newCities.push({
      place_id: prediction.place_id,
      name: cityName,
      photos: place.result.photos || []
    })
  }
  return newCities
}

export const updateProgress = async (queryClient) => {
  // Everytime Progress Changes
  const { name, startedTime, createdTime } = (await getUserData()) || {}
  const userSettings = (await getUserSettings()) || {}
  const {
    steps,
    route,
    distance,
    breakPoints,
    badges,
    cities,
    health,
    completed
  } = userSettings
  if (!name) return { success: false }

  try {
    // Get steps from startedTime till now
    const stepsRes = await getStepsNum(
      startedTime || createdTime || moment().startOf('day').toISOString()
    )
    if (!stepsRes || !Array.isArray(stepsRes) || !health)
      return {
        success: false,
        error: 'Could not fetch steps count from Apple Health'
      }
    if (!route || !distance || !breakPoints)
      return { success: false, error: 'No trip is configured' }

    const totalSteps = stepsRes.reduce((sum, item) => sum + item.value, 0) // 122280
    const progress = calcSteps(totalSteps)
    const radius = getRadius(distance)

    console.log('progress', totalSteps, steps, progress, distance, completed)

    // Check if total steps has changed
    if ((totalSteps === steps && progress < distance) || !!completed)
      return {
        success: false,
        error: 'Total steps did not change or trip is completed'
      }

    console.log('new progress')

    const progressIdx = Math.round(
      (calcProgress(totalSteps, distance) / 100) * route?.length
    ) // 222280
    const progressRoute = getDestinationStep(progressIdx, route)
    const destinationPoint =
      !!progressRoute && progressRoute.length > 0
        ? progressRoute[progressRoute.length - 1]
        : route[0]

    console.log('new progress 1', destinationPoint)

    // Calculate distance from progress to each break point
    const newBadges = calcBreakpointsProgress(
      progressIdx,
      destinationPoint,
      route,
      breakPoints,
      badges,
      radius
    )

    console.log('new progress 2', newBadges.length)

    //  Check if city is new then add city badge
    const newCities = await checkCity(destinationPoint, cities)

    console.log('new progress 3', newCities.length)

    await setUserSettings({
      ...userSettings,
      steps: totalSteps,
      badges: newBadges,
      cities: [...cities, ...newCities],
      completed: progress >= distance ? moment().toISOString() : undefined
    })

    await queryClient?.invalidateQueries(['settings'])
    await queryClient?.invalidateQueries(['stats'])

    const alerts = []
    newCities.forEach((city) => {
      alerts.push({ type: 'cities', name: city.name })
    })

    console.log('new progress 4', alerts.length)

    return { success: true, alerts }
  } catch (error) {
    console.log(error.code, error.message)
  }
  return { success: true }
}

export const checkFlow = async (user) => {
  // Everytime Progress Changes
  const { name, startedTime, createdTime } = (await getUserData()) || {}
  const userSettings = (await getUserSettings()) || {}
  const { steps, route, distance, breakPoints, health, completed } =
    userSettings
  if (!user || !name) {
    const onboardingDone = await AsyncStorage.getItem('onboarding_completed')
    return onboardingDone ? 'Welcome' : 'Onboarding'
  }

  // Check if user has completed payment flow
  const paymentFlowCompleted = await hasCompletedPaymentFlow()
  if (!paymentFlowCompleted) {
    return 'CreditCard'
  }

  try {
    // Get steps from startedTime till now
    const stepsRes = await getStepsNum(
      startedTime || createdTime || moment().startOf('day').toISOString()
    )
    if (!stepsRes || !Array.isArray(stepsRes) || !health) {
      return 'AppleHealth'
    }
    if (!route || !distance || !breakPoints) {
      return 'Trip'
    }
  } catch (error) {
    console.log(error.code, error.message)
  }
  return 'Main'
}

import { hasActiveSubscription } from './subscription'

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
