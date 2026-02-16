import AsyncStorage from '@react-native-async-storage/async-storage'
import { Notifications } from 'react-native-notifications'

const NOTIFICATION_PREFS_KEY = 'notification_prefs'

const DEFAULT_PREFS = {
  enabled: true,
  inactivityReminder: true,
  streakReminder: true,
  milestoneAlerts: true,
  dailyGoalReminder: true,
  quietHoursStart: 22,
  quietHoursEnd: 7
}

const getNotificationPrefs = async () => {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY)
    if (!raw || raw === 'null') {
      return DEFAULT_PREFS
    }
    return JSON.parse(raw)
  } catch (e) {
    console.log('getNotificationPrefs error:', e)
    return DEFAULT_PREFS
  }
}

const saveNotificationPrefs = async (prefs) => {
  try {
    await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs))
  } catch (e) {
    console.log('saveNotificationPrefs error:', e)
  }
}

const registerNotifications = () => {
  Notifications.registerRemoteNotifications()
}

const isInQuietHours = (prefs) => {
  const now = new Date()
  const currentHour = now.getHours()
  const { quietHoursStart, quietHoursEnd } = prefs

  // Quiet hours span midnight (e.g. 22:00 - 07:00)
  if (quietHoursStart > quietHoursEnd) {
    return currentHour >= quietHoursStart || currentHour < quietHoursEnd
  }

  // Quiet hours within same day (e.g. 13:00 - 15:00)
  return currentHour >= quietHoursStart && currentHour < quietHoursEnd
}

const scheduleInactivityReminder = async (lastActiveDate) => {
  const prefs = await getNotificationPrefs()
  if (!prefs.enabled || !prefs.inactivityReminder) return
  if (isInQuietHours(prefs)) return

  const now = new Date()
  const lastActive = new Date(lastActiveDate)
  const diffMs = now.getTime() - lastActive.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays > 2) {
    Notifications.postLocalNotification({
      title: 'Time to Walk!',
      body: 'We miss you! Your virtual journey is waiting.',
      sound: 'default',
      category: 'inactivity'
    })
  }
}

const scheduleMilestoneAlert = async (currentSteps, nextMilestoneSteps) => {
  const prefs = await getNotificationPrefs()
  if (!prefs.enabled || !prefs.milestoneAlerts) return
  if (isInQuietHours(prefs)) return

  const threshold = nextMilestoneSteps * 0.9
  if (currentSteps >= threshold && currentSteps < nextMilestoneSteps) {
    const remainingKm = ((nextMilestoneSteps - currentSteps) / 1200).toFixed(1)
    Notifications.postLocalNotification({
      title: 'Milestone Approaching!',
      body: `You're almost at ${nextMilestoneSteps.toLocaleString()} km!`,
      sound: 'default',
      category: 'milestone'
    })
  }
}

const scheduleStreakReminder = async () => {
  const prefs = await getNotificationPrefs()
  if (!prefs.enabled || !prefs.streakReminder) return
  if (isInQuietHours(prefs)) return

  Notifications.postLocalNotification({
    title: 'Streak Reminder',
    body: 'Keep your streak going! Walk today to maintain progress.',
    sound: 'default',
    category: 'streak'
  })
}

const scheduleDailyGoalReminder = async (goalSteps) => {
  const prefs = await getNotificationPrefs()
  if (!prefs.enabled || !prefs.dailyGoalReminder) return
  if (isInQuietHours(prefs)) return

  Notifications.postLocalNotification({
    title: 'Daily Goal',
    body: `You're ${goalSteps.toLocaleString()} steps away from your daily goal!`,
    sound: 'default',
    category: 'daily_goal'
  })
}

const cancelAllScheduled = () => {
  Notifications.cancelAllLocalNotifications()
}

export {
  getNotificationPrefs,
  saveNotificationPrefs,
  registerNotifications,
  scheduleInactivityReminder,
  scheduleMilestoneAlert,
  scheduleStreakReminder,
  scheduleDailyGoalReminder,
  cancelAllScheduled,
  isInQuietHours,
  DEFAULT_PREFS
}
