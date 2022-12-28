import React, { useState } from 'react'
import type { Node } from 'react'
import { NativeBaseProvider } from 'native-base'
import theme from './src/theme'
import { Routes } from './src/routes'

const App: () => Node = () => (
  <NativeBaseProvider theme={theme}>
    <Routes />
  </NativeBaseProvider>
)

export default App
