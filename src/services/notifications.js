import { getData, storeData } from './database'
import { Notifications } from 'react-native-notifications'

const NOTIFICATION_PREFS_KEY = 'notification_prefs'

const DEFAULT_PREFS = {
  enabled: false,
  milestoneAlerts: true,
  dailyGoalReminder: true,
  quietHoursStart: 22,
  quietHoursEnd: 7
}

const getNotificationPrefs = async () => {
  try {
    const raw = await getData(NOTIFICATION_PREFS_KEY)
    if (!raw || raw === 'null') {
      return DEFAULT_PREFS
    }
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
  } catch (e) {
    console.log('getNotificationPrefs error:', e)
    return DEFAULT_PREFS
  }
}

const saveNotificationPrefs = (prefs) =>
  storeData(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs))

const registerNotifications = () => Notifications.registerRemoteNotifications()
const clearNotifications = () => Notifications.removeAllDeliveredNotifications()

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

export {
  getNotificationPrefs,
  saveNotificationPrefs,
  registerNotifications,
  clearNotifications,
  isInQuietHours
}
