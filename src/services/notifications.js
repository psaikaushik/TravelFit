import { Platform } from 'react-native'
import { Notifications } from 'react-native-notifications'
import { getCurrentAccountId, getData, storeData } from './database'

const NOTIFICATION_PREFS_KEY = 'notification_prefs'

const DEFAULT_PREFS = {
  enabled: false,
  milestoneAlerts: true,
  dailyGoalReminder: true,
  quietHoursStart: 22,
  quietHoursEnd: 7
}

const getNotificationPrefs = async (uid) => {
  try {
    const raw = await getData(NOTIFICATION_PREFS_KEY, uid)
    if (!raw || raw === 'null') {
      return DEFAULT_PREFS
    }
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
  } catch (e) {
    console.log('getNotificationPrefs error:', e)
    return DEFAULT_PREFS
  }
}

const saveNotificationPrefs = (prefs, uid) =>
  storeData(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs), uid)

const registerNotifications = () => Notifications.registerRemoteNotifications()
const clearNotifications = () => {
  try {
    Notifications.ios.cancelAllLocalNotifications()
  } finally {
    Notifications.removeAllDeliveredNotifications()
  }
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

const listenForNotifications = () => {
  if (Platform.OS !== 'ios') return

  let listening = true
  const events = Notifications.events()
  const foreground = events.registerNotificationReceivedForeground(async ({ payload }, complete) => {
    let show = false
    try {
      const uid = getCurrentAccountId()
      if (!uid || payload?.accountId !== uid) return

      const prefs = await getNotificationPrefs(uid)
      const categoryEnabled = payload.category === 'BADGE'
        ? prefs.milestoneAlerts
        : payload.category === 'GOAL' && prefs.dailyGoalReminder
      show = listening && getCurrentAccountId() === uid &&
        prefs.enabled && categoryEnabled && !isInQuietHours(prefs)
    } catch {
      show = false
    } finally {
      complete({ alert: show, sound: show, badge: false })
    }
  })
  const opened = events.registerNotificationOpened((_, complete) => complete())

  return () => {
    listening = false
    foreground.remove()
    opened.remove()
  }
}

export {
  getNotificationPrefs,
  saveNotificationPrefs,
  registerNotifications,
  clearNotifications,
  isInQuietHours,
  listenForNotifications
}
