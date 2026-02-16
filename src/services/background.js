import { useEffect, useState } from 'react'
import { NativeAppEventEmitter } from 'react-native'
import { Notifications } from 'react-native-notifications'
import { updateProgress, calcSteps } from './helpers'
import { checkDailyGoal } from './streak'
import { useQueryClient } from '@tanstack/react-query'
import { updateLeaderboardEntry } from './leaderboards'
import { updateMyProgress } from './friends'
import { getUserSettings } from './database'

const useBackgroundTasks = () => {
  const queryClient = useQueryClient()
  const [tasks, setTasks] = useState([])

  const initBackgroundTasks = () => {
    console.log('healthKit:background')

    NativeAppEventEmitter.addListener(
      'healthKit:StepCount:setup:success',
      (...args) => {
        console.log('healthKit:StepCount:setup:success', args)
      }
    )

    NativeAppEventEmitter.addListener('healthKit:StepCount:new', (...args) => {
      console.log('healthKit:StepCount:new')

      // Update trip progress
      updateProgress(queryClient).then(({ success, alerts, error }) => {
        console.log('progress updated', success, alerts, error)
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
            console.log('leaderboard update error:', e)
          )
          updateMyProgress({
            steps,
            distance,
            routeName: settings.starting?.title && settings.destination?.title
              ? `${settings.starting.title} → ${settings.destination.title}`
              : null,
            progress: settings.distance ? Math.min((distance / settings.distance) * 100, 100) : 0
          }).catch((e) => console.log('social progress update error:', e))
        }
      })

      // Check daily step goal and streak
      checkDailyGoal().then((result) => {
        console.log('daily goal check', result)

        if (result.isFirstTimeToday) {
          // Goal reached for the first time today — celebrate!
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

        // Refresh streak data in UI
        queryClient.invalidateQueries(['streak'])
        queryClient.invalidateQueries(['streak-profile'])
      }).catch((err) => {
        console.log('daily goal check error:', err)
      })
    })

    Notifications.registerRemoteNotifications()

    Notifications.events().registerRemoteNotificationsRegistered((event) => {
      console.log('Device Token Received', event.deviceToken)
    })
    Notifications.events().registerRemoteNotificationsRegistrationFailed(
      (event) => {
        console.log('event', event)
      }
    )
    Notifications.events().registerNotificationReceivedForeground(
      (notification: Notification, completion) => {
        console.log(
          `Notification received in foreground: ${notification.title} : ${notification.body}`
        )
        completion({ alert: true, sound: true, badge: false })
      }
    )
    Notifications.events().registerNotificationOpened(
      (notification: Notification, completion) => {
        console.log(`Notification opened: ${notification.payload}`)
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
