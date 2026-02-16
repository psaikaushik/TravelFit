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
import 'react-native-gesture-handler'

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
    <StripeProvider
      publishableKey={STRIPE_CONFIG.publishableKey}
      merchantIdentifier={STRIPE_CONFIG.merchantIdentifier}
    >
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <App />
        </SafeAreaProvider>
      </QueryClientProvider>
    </StripeProvider>
  )
}

AppRegistry.registerComponent(appName, () => Main)
