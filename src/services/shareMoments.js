import { Share } from 'react-native'
import { getUserSettings, getUserData } from './database'
import { calcProgress, prettifyNum, calcSteps } from './helpers'
import moment from 'moment'

// Generate milestone share content
export const getMilestoneShareData = async () => {
  const settings = await getUserSettings()
  const userData = await getUserData()
  if (!settings) return null

  const {
    starting,
    destination,
    steps = 0,
    distance = 1,
    badges = [],
    cities = [],
    startedTime
  } = settings

  const progress = Math.min(calcProgress(steps, distance), 100)
  const distanceWalked = parseFloat(calcSteps(steps))
  const landmarksDiscovered = badges.filter((b) => b?.progress >= 100).length
  const landmarksTotal = badges.length
  const citiesVisited = cities.length
  const daysOnRoute = startedTime
    ? moment().diff(moment(startedTime), 'days')
    : 0

  return {
    userName: userData?.name || 'TravelFit Walker',
    routeName: `${starting?.title || 'Start'} → ${destination?.title || 'Destination'}`,
    starting: starting?.title || 'Start',
    destination: destination?.title || 'Destination',
    progress: progress.toFixed(1),
    steps,
    stepsFormatted: prettifyNum(steps),
    distanceWalked: distanceWalked.toFixed(1),
    totalDistance: distance,
    landmarksDiscovered,
    landmarksTotal,
    citiesVisited,
    cityNames: cities.map((c) => c.name?.split(',')[0]).filter(Boolean),
    daysOnRoute,
    isCompleted: progress >= 100,
    startedTime
  }
}

// Get weekly summary share data
export const getWeeklySummaryData = async (weeklySteps = 0, dailyAvg = 0) => {
  const settings = await getUserSettings()
  const userData = await getUserData()
  if (!settings) return null

  const { starting, destination, distance = 1, steps = 0 } = settings
  const progress = Math.min(calcProgress(steps, distance), 100)

  return {
    userName: userData?.name || 'TravelFit Walker',
    routeName: `${starting?.title || 'Start'} → ${destination?.title || 'Destination'}`,
    weeklySteps,
    weeklyStepsFormatted: prettifyNum(weeklySteps),
    weeklyDistance: parseFloat(calcSteps(weeklySteps)).toFixed(1),
    dailyAvg,
    dailyAvgFormatted: prettifyNum(Math.round(dailyAvg)),
    overallProgress: progress.toFixed(1),
    weekStartDate: moment().startOf('isoWeek').format('MMM D'),
    weekEndDate: moment().endOf('isoWeek').format('MMM D')
  }
}

// Share route completion
export const shareRouteCompletion = async () => {
  const data = await getMilestoneShareData()
  if (!data) return

  const message =
    `I just completed my virtual journey!\n\n` +
    `Route: ${data.routeName}\n` +
    `Total Steps: ${data.stepsFormatted}\n` +
    `Distance: ${data.distanceWalked} km\n` +
    `Days to Complete: ${data.daysOnRoute}\n` +
    `Landmarks Discovered: ${data.landmarksDiscovered}/${data.landmarksTotal}\n` +
    `Cities Visited: ${data.citiesVisited}\n\n` +
    `Can you beat my time? Race me on TravelFit!`

  try {
    await Share.share({ message })
  } catch (error) {
    console.log('Share error:', error)
  }
}

// Share current progress
export const shareCurrentProgress = async () => {
  const data = await getMilestoneShareData()
  if (!data) return

  const progressBar = generateProgressBar(parseFloat(data.progress))

  const message =
    `My TravelFit Journey\n\n` +
    `${data.starting} → ${data.destination}\n` +
    `${progressBar} ${data.progress}%\n\n` +
    `Steps: ${data.stepsFormatted}\n` +
    `Distance: ${data.distanceWalked}/${data.totalDistance} km\n` +
    `Landmarks: ${data.landmarksDiscovered}/${data.landmarksTotal}\n` +
    `Cities: ${data.citiesVisited}\n` +
    `Days Walking: ${data.daysOnRoute}\n\n` +
    `Walk the world with me on TravelFit!`

  try {
    await Share.share({ message })
  } catch (error) {
    console.log('Share error:', error)
  }
}

// Share weekly summary
export const shareWeeklySummary = async (weeklySteps, dailyAvg) => {
  const data = await getWeeklySummaryData(weeklySteps, dailyAvg)
  if (!data) return

  const message =
    `My TravelFit Week (${data.weekStartDate} - ${data.weekEndDate})\n\n` +
    `Weekly Steps: ${data.weeklyStepsFormatted}\n` +
    `Weekly Distance: ${data.weeklyDistance} km\n` +
    `Daily Average: ${data.dailyAvgFormatted} steps\n` +
    `Route Progress: ${data.overallProgress}%\n\n` +
    `Join me on TravelFit!`

  try {
    await Share.share({ message })
  } catch (error) {
    console.log('Share error:', error)
  }
}

// Share race victory
export const shareRaceResult = async (raceName, position, totalParticipants) => {
  const userData = await getUserData()
  const name = userData?.name || 'A TravelFit Walker'

  let headline
  if (position === 1) {
    headline = `${name} won the race!`
  } else if (position <= 3) {
    headline = `${name} finished #${position} in the race!`
  } else {
    headline = `${name} completed the race!`
  }

  const message =
    `${headline}\n\n` +
    `Race: ${raceName}\n` +
    `Position: #${position} of ${totalParticipants}\n\n` +
    `Think you can beat me? Challenge me on TravelFit!`

  try {
    await Share.share({ message })
  } catch (error) {
    console.log('Share error:', error)
  }
}

// Share landmark discovery
export const shareLandmarkDiscovery = async (landmarkName, routeName) => {
  const message =
    `Just discovered ${landmarkName} on my virtual journey!\n\n` +
    `Route: ${routeName}\n\n` +
    `Discover landmarks around the world with TravelFit!`

  try {
    await Share.share({ message })
  } catch (error) {
    console.log('Share error:', error)
  }
}

// Generate a text-based progress bar
const generateProgressBar = (percent) => {
  const filled = Math.round(percent / 10)
  const empty = 10 - filled
  return '[' + '='.repeat(filled) + '-'.repeat(empty) + ']'
}

// Card types available for sharing
export const SHARE_CARD_TYPES = {
  PROGRESS: 'progress',
  MILESTONE: 'milestone',
  WEEKLY: 'weekly',
  RACE: 'race',
  LANDMARK: 'landmark',
  COMPLETION: 'completion',
  STREAK: 'streak'
}

// Get streak share data
export const shareStreak = async (currentStreak, longestStreak) => {
  const userData = await getUserData()
  const name = userData?.name || 'A TravelFit Walker'

  const message =
    `${name} is on a ${currentStreak}-day walking streak!\n\n` +
    `Current Streak: ${currentStreak} days\n` +
    `Longest Streak: ${longestStreak} days\n\n` +
    `Start your own streak on TravelFit!`

  try {
    await Share.share({ message })
  } catch (error) {
    console.log('Share error:', error)
  }
}

export default {
  getMilestoneShareData,
  getWeeklySummaryData,
  shareRouteCompletion,
  shareCurrentProgress,
  shareWeeklySummary,
  shareRaceResult,
  shareLandmarkDiscovery,
  shareStreak,
  SHARE_CARD_TYPES
}
