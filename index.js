/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native'
import App from './App'
import { name as appName } from './app.json'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'

LogBox.ignoreAllLogs()

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
