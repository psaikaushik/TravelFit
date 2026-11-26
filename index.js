import 'react-native-gesture-handler'
import React from 'react'
import { AppRegistry } from 'react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import App from './App'
import { name as appName } from './app.json'

const queryClient = new QueryClient()

export default function Main() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <App />
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}

AppRegistry.registerComponent(appName, () => Main)
