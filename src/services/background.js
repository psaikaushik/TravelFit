import { NativeAppEventEmitter } from 'react-native'
import { useEffect, useState } from 'react'
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
      updateProgress(queryClient).then((success) => {
        console.log('progress updated', success)
      })
    })
  }

  useEffect(() => {
    initBackgroundTasks()
  }, [])

  return tasks
}

export default useBackgroundTasks
