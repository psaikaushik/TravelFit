import { getCurrentAccountId, getData, storeData } from './database'
import moment from 'moment'
import { getStepsNumAtDate } from './helpers'

const STREAK_KEY = 'streak_data'
const DEFAULT_DAILY_GOAL = 10000

const getStreakData = async (uid) => {
  try {
    const raw = await getData(STREAK_KEY, uid)
    if (!raw || raw === 'null') {
      return {
        dailyGoal: DEFAULT_DAILY_GOAL,
        currentStreak: 0,
        longestStreak: 0,
        lastStreakDate: null,
        goalReachedToday: false,
        goalReachedDate: null
      }
    }
    return JSON.parse(raw)
  } catch (e) {
    console.log('getStreakData error:', e)
    return {
      dailyGoal: DEFAULT_DAILY_GOAL,
      currentStreak: 0,
      longestStreak: 0,
      lastStreakDate: null,
      goalReachedToday: false,
      goalReachedDate: null
    }
  }
}

const saveStreakData = async (data, uid) => {
  try {
    await storeData(STREAK_KEY, JSON.stringify(data), uid)
  } catch (e) {
    console.log('saveStreakData error:', e)
  }
}

const setDailyGoal = async (goal) => {
  const uid = getCurrentAccountId()
  if (!uid) return

  const data = await getStreakData(uid)
  data.dailyGoal = goal
  await saveStreakData(data, uid)
  return data
}

const getTodaySteps = async () => {
  try {
    const startOfToday = moment().startOf('day').toISOString()
    const results = await getStepsNumAtDate(startOfToday)
    if (!results || !Array.isArray(results)) return 0
    return results
      .filter((x) => moment().isSame(x.startDate, 'day'))
      .reduce((sum, item) => sum + item.value, 0)
  } catch (e) {
    console.log('getTodaySteps error:', e)
    return 0
  }
}

// If today's goal is still in progress, a streak can continue from yesterday.
const calculateStreak = async (uid = getCurrentAccountId()) => {
  const data = await getStreakData(uid)
  if (!uid || uid !== getCurrentAccountId()) return data

  const today = moment().startOf('day')
  const earliest = today.clone().subtract(364, 'days')
  const samples = await getStepsNumAtDate(earliest.toISOString())
  if (!samples?.length || uid !== getCurrentAccountId()) return data

  const totals = new Map()
  for (const sample of samples) {
    const date = moment(sample.startDate).format('YYYY-MM-DD')
    totals.set(date, (totals.get(date) || 0) + (Number(sample.value) || 0))
  }

  const goalReachedToday = (totals.get(today.format('YYYY-MM-DD')) || 0) >= data.dailyGoal
  const day = today.clone().subtract(goalReachedToday ? 0 : 1, 'days')
  let streak = 0
  while (!day.isBefore(earliest) && (totals.get(day.format('YYYY-MM-DD')) || 0) >= data.dailyGoal) {
    streak++
    day.subtract(1, 'days')
  }

  const longestStreak = Math.max(data.longestStreak || 0, streak)

  const updatedData = {
    ...data,
    currentStreak: streak,
    longestStreak,
    goalReachedToday,
    goalReachedDate: goalReachedToday ? today.toISOString() : data.goalReachedDate,
    lastStreakDate: streak > 0
      ? today.clone().subtract(goalReachedToday ? 0 : 1, 'days').toISOString()
      : data.lastStreakDate
  }

  await saveStreakData(updatedData, uid)
  return updatedData
}

/**
 * Quick check: does today's step count meet the goal?
 * Also returns whether this is the FIRST time it was reached today (for celebration).
 */
const checkDailyGoal = async () => {
  const uid = getCurrentAccountId()
  const data = await getStreakData(uid)
  const todaySteps = await getTodaySteps()
  const goalMet = todaySteps >= data.dailyGoal
  const today = moment().startOf('day').toISOString()

  // Was goal already celebrated today?
  const alreadyCelebrated =
    data.goalReachedToday &&
    data.goalReachedDate &&
    moment(data.goalReachedDate).isSame(today, 'day')

  const isFirstTimeToday = goalMet && !alreadyCelebrated

  if (isFirstTimeToday) {
    // Mark as celebrated and recalculate streak
    const updated = await calculateStreak(uid)
    return {
      goalMet: true,
      isFirstTimeToday: true,
      todaySteps,
      dailyGoal: data.dailyGoal,
      currentStreak: updated.currentStreak,
      longestStreak: updated.longestStreak
    }
  }

  return {
    goalMet,
    isFirstTimeToday: false,
    todaySteps,
    dailyGoal: data.dailyGoal,
    currentStreak: data.currentStreak,
    longestStreak: data.longestStreak
  }
}

/**
 * Lightweight version: returns streak data + today's steps without
 * the expensive backwards calculation. Use for UI display.
 */
const getStreakSummary = async () => {
  const data = await getStreakData()
  const todaySteps = await getTodaySteps()

  return {
    todaySteps,
    dailyGoal: data.dailyGoal,
    currentStreak: data.currentStreak,
    longestStreak: data.longestStreak || 0,
    goalReachedToday: todaySteps >= data.dailyGoal,
    progress: Math.min((todaySteps / data.dailyGoal) * 100, 100)
  }
}

export {
  getStreakData,
  saveStreakData,
  setDailyGoal,
  getTodaySteps,
  calculateStreak,
  checkDailyGoal,
  getStreakSummary,
  DEFAULT_DAILY_GOAL
}
