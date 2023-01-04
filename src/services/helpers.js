import AppleHealthKit from 'react-native-health'
import moment from 'moment'

const calcSteps = (steps = 0) => {
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

export const stepsToDistance = (steps = 0) => {
  return prettifyNum(calcSteps(steps))
}

export const calcProgress = (steps = 0, distance = 1) => {
  return (calcSteps(steps) / distance) * 100
}

export const calcRemaining = (steps = 0, distance = 1) => {
  return prettifyNum((((distance - calcSteps(steps)) * 100) / 100).toFixed(2))
}

export const checkAppleHealth = () =>
  new Promise((resolve, reject) => {
    try {
      AppleHealthKit.getStepCount(
        {
          startDate: new Date(2021, 1, 1).toISOString()
        },
        (callbackError, results) => {
          if (callbackError) {
            console.log('checkAppleHealth Error', callbackError)
            resolve(null)
          } else {
            resolve(results)
          }
        }
      )
    } catch (e) {
      console.log('checkAppleHealth', e)
      resolve(null)
    }
  })

export const getStepsNum = (startDate) =>
  new Promise((resolve, reject) => {
    try {
      AppleHealthKit.getStepCount(
        {
          startDate: startDate
        },
        (callbackError, results) => {
          if (callbackError) {
            console.log('getStepsNum Error', callbackError)
            reject(callbackError)
          } else {
            resolve(results)
          }
        }
      )
    } catch (e) {
      console.log('getStepsNum', e)
      reject(e)
    }
  })

export const getTodaySteps = () => getStepsNum(moment().toISOString())

export const getDateSteps = ({ queryKey }) =>
  getStepsNum(queryKey[1].toISOString())

export const getStats = async () => {
  const stats = [
    { id: 'today', date: new moment() },
    { id: 'yesterday', date: moment().subtract(1, 'days') },
    { id: 'OneDayBefore', date: moment().subtract(2, 'days') },
    { id: 'TwoDaysBefore', date: moment().subtract(3, 'days') },
    { id: 'ThreeDaysBefore', date: moment().subtract(4, 'days') }
  ]
  const steps = await Promise.all([
    getTodaySteps,
    () => getDateSteps(stats[1].date),
    () => getDateSteps(stats[2].date),
    () => getDateSteps(stats[3].date),
    () => getDateSteps(stats[4].date)
  ])
  for (let i = 0; i < stats.length; i++) {
    const data = steps[i]
    stats[i] = { ...stats[i], steps: data.value || 0 }
  }
  return stats
}

export const getTotalSteps = async () => {
  // Check last time updated or account created time
  // If last time is not today
  // Get steps from last time till today
  const steps = await getTodaySteps()
  console.log('steps', steps)
  return 0
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

export default {
  getPolygonPoints,
  checkAppleHealth,
  stepsToDistance,
  calcProgress,
  prettifyNum,
  calcRemaining
}
