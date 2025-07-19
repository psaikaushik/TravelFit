import React from 'react'
import { NativeBaseProvider } from 'native-base'
import { StripeProvider } from '@stripe/stripe-react-native'
import theme from './src/theme'
import { Routes } from './src/routes'
import { STRIPE_CONFIG } from './src/config/stripe'

const App = () => (
  <StripeProvider publishableKey={STRIPE_CONFIG.publishableKey}>
    <NativeBaseProvider theme={theme}>
      <Routes />
    </NativeBaseProvider>
  </StripeProvider>
)

export default App
