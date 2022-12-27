import React, { useEffect, useState } from 'react'
import type { Node } from 'react'
import { StatusBar, StyleSheet, View } from 'react-native'
import SplashScreen from 'react-native-splash-screen'
import Toast from 'react-native-toast-message'
import ToastConfig from './src/components/CustomToast'
import { Routes } from './src/routes'

const App: () => Node = () => {
  const [fixModal, setFixModal] = useState(-1000)

  useEffect(() => {
    SplashScreen.hide()
    StatusBar.setBarStyle('dark-content', true)
  }, [])

  return (
    <>
      <View
        style={{
          position: 'absolute',
          bottom: fixModal,
          left: 0,
          right: 0,
          zIndex: 1
        }}
      >
        <Toast
          config={ToastConfig}
          onShow={() => setFixModal(0)}
          onHide={() => setFixModal(-1000)}
          position="bottom"
          bottomOffset={70}
          zIndex={10}
        />
      </View>
      <Routes />
    </>
  )
}

export default App
