import { useEffect, useState } from 'react'
import { NativeAppEventEmitter } from 'react-native'
import { Notifications } from 'react-native-notifications'
import { updateProgress, calcSteps } from './helpers'
import { checkDailyGoal } from './streak'
import { useQueryClient } from '@tanstack/react-query'
import { updateLeaderboardEntry } from './leaderboards'
import { updateMyProgress } from './friends'
import { getUserSettings } from './database'
import logger from '../utils/logger'

const useBackgroundTasks = () => {
  const queryClient = useQueryClient()
  const [tasks, setTasks] = useState([])

  const initBackgroundTasks = () => {
    logger.log('healthKit:background')

    NativeAppEventEmitter.addListener(
      'healthKit:StepCount:setup:success',
      (...args) => {
        logger.log('healthKit:StepCount:setup:success', args)
      }
    )

    NativeAppEventEmitter.addListener('healthKit:StepCount:new', (...args) => {
      logger.log('healthKit:StepCount:new')

      // Update trip progress
      updateProgress(queryClient).then(({ success, alerts, error }) => {
        logger.log('progress updated', success, alerts, error)
        if (!!success && !!alerts) {
          alerts.forEach(({ name }) => {
            Notifications.postLocalNotification({
              title: `${name} Badge`,
              body: `Congratulations! You've received a new badge. Keep up the hard work!!`,
              category: 'BADGE',
              silent: false
            })
          })
        }
      })

      // Update leaderboard and social progress
      getUserSettings().then((settings) => {
        if (settings) {
          const steps = settings.steps || 0
          const distance = parseFloat(calcSteps(steps)) || 0
          const landmarks = (settings.badges || []).filter((b) => b?.progress >= 100).length
          const cities = (settings.cities || []).length

          updateLeaderboardEntry({ steps, distance, landmarks, cities }).catch((e) =>
            logger.log('leaderboard update error:', e)
          )
          updateMyProgress({
            steps,
            distance,
            routeName: settings.starting?.title && settings.destination?.title
              ? `${settings.starting.title} \u2192 ${settings.destination.title}`
              : null,
            progress: settings.distance ? Math.min((distance / settings.distance) * 100, 100) : 0
          }).catch((e) => logger.log('social progress update error:', e))
        }
      })

      // Check daily step goal and streak
      checkDailyGoal().then((result) => {
        logger.log('daily goal check', result)

        if (result.isFirstTimeToday) {
          const streakText = result.currentStreak > 1
            ? `${result.currentStreak}-day streak!`
            : 'Keep it up tomorrow to start a streak!'

          Notifications.postLocalNotification({
            title: 'Daily Goal Reached!',
            body: `You hit ${result.dailyGoal.toLocaleString()} steps today! ${streakText}`,
            category: 'GOAL',
            silent: false
          })
        }

        queryClient.invalidateQueries(['streak'])
        queryClient.invalidateQueries(['streak-profile'])
      }).catch((err) => {
        logger.log('daily goal check error:', err)
      })
    })

    Notifications.registerRemoteNotifications()

    Notifications.events().registerRemoteNotificationsRegistered((event) => {
      logger.log('Device Token Received', event.deviceToken)
    })
    Notifications.events().registerRemoteNotificationsRegistrationFailed(
      (event) => {
        logger.log('Remote notification registration failed', event)
      }
    )
    Notifications.events().registerNotificationReceivedForeground(
      (notification, completion) => {
        logger.log(
          `Notification received in foreground: ${notification.title} : ${notification.body}`
        )
        completion({ alert: true, sound: true, badge: false })
      }
    )
    Notifications.events().registerNotificationOpened(
      (notification, completion) => {
        logger.log(`Notification opened: ${notification.payload}`)
        completion()
      }
    )
  }

  useEffect(() => {
    initBackgroundTasks()
  }, [])

  return tasks
}

export default useBackgroundTasks
