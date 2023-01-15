import { useEffect, useState } from 'react'
import { NativeAppEventEmitter } from 'react-native'
import { Notifications } from 'react-native-notifications'
import { updateProgress } from './helpers'
import { useQueryClient } from '@tanstack/react-query'

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
      updateProgress(queryClient).then(({ success, alerts, error }) => {
        console.log('progress updated', success, alerts, error)
        if (!!success && !!alerts) {
          alerts.forEach(({ name }) => {
            Notifications.postLocalNotification({
              title: `${name} Badge`,
              body: `Congratulations! You’ve received a new badge. Keep up the hard work!!`,
              category: 'BADGE',
              silent: false
            })
          })
        }
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
