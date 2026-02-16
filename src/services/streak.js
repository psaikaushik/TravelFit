import AsyncStorage from '@react-native-async-storage/async-storage'
import moment from 'moment'
import { getStepsNumAtDate } from './helpers'

const STREAK_KEY = 'streak_data'
const DEFAULT_DAILY_GOAL = 10000

const getStreakData = async () => {
  try {
    const raw = await AsyncStorage.getItem(STREAK_KEY)
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

const saveStreakData = async (data) => {
  try {
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(data))
  } catch (e) {
    console.log('saveStreakData error:', e)
  }
}

const setDailyGoal = async (goal) => {
  const data = await getStreakData()
  data.dailyGoal = goal
  await saveStreakData(data)
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

const getDailyStepsForDate = async (date) => {
  try {
    const startDate = moment(date).startOf('day').toISOString()
    const results = await getStepsNumAtDate(startDate)
    if (!results || !Array.isArray(results)) return 0
    return results
      .filter((x) => moment(date).isSame(x.startDate, 'day'))
      .reduce((sum, item) => sum + item.value, 0)
  } catch (e) {
    return 0
  }
}

/**
 * Recalculates the streak by looking back through recent days.
 * A streak is consecutive days where steps >= dailyGoal.
 * Today counts if goal is already met.
 */
const calculateStreak = async () => {
  const data = await getStreakData()
  const { dailyGoal } = data
  const today = moment().startOf('day')

  // Check today first
  const todaySteps = await getTodaySteps()
  const goalReachedToday = todaySteps >= dailyGoal

  let streak = 0

  // If today's goal is met, count today
  if (goalReachedToday) {
    streak = 1
  }

  // Look backwards from yesterday (or today if not met, we break immediately)
  const startDay = goalReachedToday ? 1 : 0
  for (let i = startDay; i < 365; i++) {
    const checkDate = moment(today).subtract(i === 0 ? 0 : i, 'days')
    if (i === 0 && goalReachedToday) continue // already counted today

    const daySteps = await getDailyStepsForDate(checkDate)
    if (daySteps >= dailyGoal) {
      streak++
    } else {
      break
    }
  }

  const longestStreak = Math.max(data.longestStreak || 0, streak)

  const updatedData = {
    ...data,
    currentStreak: streak,
    longestStreak,
    goalReachedToday,
    goalReachedDate: goalReachedToday ? today.toISOString() : data.goalReachedDate,
    lastStreakDate: streak > 0 ? today.toISOString() : data.lastStreakDate
  }

  await saveStreakData(updatedData)
  return updatedData
}

/**
 * Quick check: does today's step count meet the goal?
 * Also returns whether this is the FIRST time it was reached today (for celebration).
 */
const checkDailyGoal = async () => {
  const data = await getStreakData()
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
    const updated = await calculateStreak()
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
  const today = moment().startOf('day')

  // If goalReachedDate is not today, reset goalReachedToday
  const goalReachedToday = data.goalReachedDate &&
    moment(data.goalReachedDate).isSame(today, 'day')
    ? data.goalReachedToday
    : todaySteps >= data.dailyGoal

  return {
    todaySteps,
    dailyGoal: data.dailyGoal,
    currentStreak: data.currentStreak,
    longestStreak: data.longestStreak || 0,
    goalReachedToday,
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
