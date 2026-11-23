import React from 'react'
import { AppRegistry, Text } from 'react-native'
import renderer from 'react-test-renderer'
import { name as appName } from '../app.json'

jest.mock('react-native-gesture-handler', () => ({}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children
}))
jest.mock('native-base', () => ({
  NativeBaseProvider: ({ children }) => children,
  extendTheme: (theme) => theme
}))
jest.mock('../src/routes', () => ({
  Routes: () => {
    const React = require('react')
    const { Text } = require('react-native')
    return <Text>TravelFit navigation</Text>
  }
}))

it('launches the fitness router from the registered TravelFit app', () => {
  const register = jest.spyOn(AppRegistry, 'registerComponent')
  require('../index')
  expect(register).toHaveBeenCalledWith(appName, expect.any(Function))
  const Main = register.mock.calls[0][1]()
  register.mockRestore()
  const app = renderer.create(<Main />)
  expect(app.root.findByType(Text).props.children).toBe('TravelFit navigation')
  app.unmount()
})
