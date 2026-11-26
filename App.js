import React, { useEffect } from 'react'
import { NativeBaseProvider } from 'native-base'
import { Routes } from './src/routes'
import theme from './src/theme'
import { listenForNotifications } from './src/services/notifications'

export default function App() {
  useEffect(listenForNotifications, [])

  return (
    <NativeBaseProvider theme={theme}>
      <Routes />
    </NativeBaseProvider>
  )
}
