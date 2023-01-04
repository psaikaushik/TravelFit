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

export default {
  checkAppleHealth,
  stepsToDistance,
  calcProgress,
  prettifyNum,
  calcRemaining
}
