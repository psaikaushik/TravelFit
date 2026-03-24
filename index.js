/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native'
import App from './App'
import { name as appName } from './app.json'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StripeProvider } from '@stripe/stripe-react-native'
import { STRIPE_CONFIG } from './src/config/stripe'
import ErrorBoundary from './src/components/ErrorBoundary'
import { ThemeProvider } from './src/context/ThemeContext'
import 'react-native-gesture-handler'

if (__DEV__) {
  LogBox.ignoreLogs([
    'Non-serializable values were found in the navigation state',
    'ViewPropTypes will be removed'
  ])
} else {
  LogBox.ignoreAllLogs()
}

export default function Main() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000 // 10 minutes
      }
    }
  })

  return (
    <StripeProvider
      publishableKey={STRIPE_CONFIG.publishableKey}
      merchantIdentifier={STRIPE_CONFIG.merchantIdentifier}
    >
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </StripeProvider>
  )
}

AppRegistry.registerComponent(appName, () => Main)
