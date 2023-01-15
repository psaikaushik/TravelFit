/**
 * @format
 */

import { AppRegistry, LogBox, NativeAppEventEmitter } from 'react-native'
import App from './App'
import { name as appName } from './app.json'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import 'react-native-gesture-handler'

LogBox.ignoreAllLogs()

NativeAppEventEmitter.addListener(
  'healthKit:StepCount:setup:a7a',
  (...args) => {
    console.log('healthKit:StepCount:setup:failure', args)
  }
)

export default function Main() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1 // TODO fix cached queries
      }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <App />
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}

AppRegistry.registerComponent(appName, () => Main)
