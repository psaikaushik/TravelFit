import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, NativeAppEventEmitter } from 'react-native'
import { Notifications } from 'react-native-notifications'
import { useQueryClient } from '@tanstack/react-query'
import { updateProgress } from './helpers'
import { checkDailyGoal } from './streak'
import { getNotificationPrefs, isInQuietHours } from './notifications'
import { getCurrentAccountId } from './database'

const useBackgroundTasks = () => {
  const queryClient = useQueryClient()
  const mounted = useRef(false)
  const syncing = useRef(false)
  const syncQueued = useRef(false)
  const [status, setStatus] = useState('syncing')

  const sync = useCallback(async () => {
    if (!mounted.current) return
    if (syncing.current) {
      syncQueued.current = true
      return
    }
    syncing.current = true
    setStatus('syncing')
    const uid = getCurrentAccountId()

    try {
      const result = await updateProgress(queryClient)
      if (!mounted.current || getCurrentAccountId() !== uid) return
      setStatus(result.status)

      if (result.status !== 'ready' && result.status !== 'complete') return

      const [goal, prefs] = await Promise.all([checkDailyGoal(), getNotificationPrefs(uid)])
      if (!mounted.current || getCurrentAccountId() !== uid) return
      await Promise.all([
        queryClient.invalidateQueries(['streak']),
        queryClient.invalidateQueries(['streak-profile'])
      ])
      if (!mounted.current || getCurrentAccountId() !== uid) return
      if (!prefs.enabled || isInQuietHours(prefs)) return

      if (prefs.milestoneAlerts) {
        for (const { name } of result.alerts || []) {
          Notifications.postLocalNotification({
            title: `${name} Badge`,
            body: `You've reached ${name} on your virtual route.`,
            category: 'BADGE',
            accountId: uid,
            silent: false
          })
        }
      }

      if (prefs.dailyGoalReminder && goal.isFirstTimeToday) {
        Notifications.postLocalNotification({
          title: 'Daily Goal Reached!',
          body: `You hit ${goal.dailyGoal.toLocaleString()} steps today!`,
          category: 'GOAL',
          accountId: uid,
          silent: false
        })
      }
    } catch {
      if (mounted.current && getCurrentAccountId() === uid) setStatus('unavailable')
    } finally {
      // A step event can arrive after the ongoing query took its snapshot.
      const runAgain = syncQueued.current && mounted.current && getCurrentAccountId() === uid
      syncQueued.current = false
      syncing.current = false
      if (runAgain) void sync()
    }
  }, [queryClient])

  useEffect(() => {
    mounted.current = true
    const steps = NativeAppEventEmitter.addListener('healthKit:StepCount:new', sync)
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync()
    })
    sync()

    return () => {
      mounted.current = false
      steps.remove()
      appState.remove()
    }
  }, [sync])

  return { status, sync }
}

export default useBackgroundTasks
