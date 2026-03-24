import React, { createContext, useContext, useState, useEffect } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const ThemeContext = createContext({
  isDark: false,
  toggle: () => {},
  colors: {}
})

const lightColors = {
  background: '#F5F6FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#1A2225',
  textSecondary: '#6B7280',
  border: '#E8EAF0',
  statusBar: 'dark-content'
}

const darkColors = {
  background: '#0F1419',
  surface: '#1A2225',
  card: '#232B30',
  text: '#F5F6FA',
  textSecondary: '#9CA3AF',
  border: '#2D3740',
  statusBar: 'light-content'
}

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme()
  const [mode, setMode] = useState('system') // 'light' | 'dark' | 'system'

  useEffect(() => {
    AsyncStorage.getItem('theme_mode').then((saved) => {
      if (saved) setMode(saved)
    })
  }, [])

  const isDark =
    mode === 'system' ? systemScheme === 'dark' : mode === 'dark'

  const toggle = async () => {
    const next = mode === 'system' ? 'dark' : mode === 'dark' ? 'light' : 'system'
    setMode(next)
    await AsyncStorage.setItem('theme_mode', next)
  }

  const colors = isDark ? darkColors : lightColors

  return (
    <ThemeContext.Provider value={{ isDark, toggle, mode, colors }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

export default ThemeContext
