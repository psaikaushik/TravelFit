import React from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import AppleHealthKit from 'react-native-health'
import renderer, { act } from 'react-test-renderer'
import AppleHealth from '../src/screens/AppleHealth'
import { buildCuratedTrip, VIRTUAL_ROUTES } from '../src/data/curatedRoutes'
import { getUserSettings, setUserSettings } from '../src/services/database'

let mockUser
let mockNavigation
let mockToast

jest.mock('@react-native-firebase/auth', () => () => ({
  get currentUser() {
    return mockUser
  }
}))
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'))
jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true,
  useNavigation: () => mockNavigation
}))
jest.mock('native-base', () => ({
  Button: 'Button',
  Container: 'Container',
  Flex: 'Flex',
  Text: 'Text',
  useToast: () => mockToast
}))
jest.mock('react-native-health', () => ({
  Constants: { Permissions: { StepCount: 'StepCount' } },
  initHealthKit: jest.fn()
}))
jest.mock('../src/services/maps', () => ({}))
jest.mock('../src/services/subscription', () => ({ hasActiveSubscription: jest.fn() }))

let screen

beforeEach(async () => {
  await AsyncStorage.clear()
  jest.clearAllMocks()
  mockUser = { uid: 'walker' }
  mockNavigation = { reset: jest.fn() }
  mockToast = { show: jest.fn() }
  AppleHealthKit.initHealthKit.mockImplementation((_, callback) => callback(null, true))
  await act(async () => {
    screen = renderer.create(<AppleHealth />)
  })
})

afterEach(() => {
  act(() => screen.unmount())
})

const connectButton = () => screen.root.findByProps({
  accessibilityLabel: 'Connect to Apple Health'
})
const skipButton = () => screen.root.findAllByType('Button').find(({ props }) =>
  props.children === 'Continue without syncing')

const press = async (button) => {
  await act(async () => { await button.props.onPress() })
}

it('skips the native request, saves opt-out, and opens the route picker', async () => {
  await press(skipButton())

  expect(AppleHealthKit.initHealthKit).not.toHaveBeenCalled()
  expect(await getUserSettings('walker')).toEqual({ health: false, healthSetupCompleted: true })
  expect(mockNavigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Trip' }] })
})

it('requests only step read access, saves opt-in, and opens the route picker on completion', async () => {
  await press(connectButton())

  expect(AppleHealthKit.initHealthKit).toHaveBeenCalledWith({
    permissions: { read: ['StepCount'], write: [] }
  }, expect.any(Function))
  expect(await getUserSettings('walker')).toEqual({ health: true, healthSetupCompleted: true })
  expect(mockNavigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Trip' }] })
})

it('stays on Health setup after a native error and lets the person skip', async () => {
  AppleHealthKit.initHealthKit.mockImplementation((_, callback) => callback(new Error('Unavailable')))

  await press(connectButton())

  expect(mockToast.show).toHaveBeenCalledWith({
    status: 'error',
    description: 'Could not open Health permissions. You can continue without syncing.'
  })
  expect(await getUserSettings('walker')).toEqual({})
  expect(mockNavigation.reset).not.toHaveBeenCalled()
  expect(skipButton().props.isDisabled).toBe(false)

  await press(skipButton())
  expect(await getUserSettings('walker')).toMatchObject({ health: false })
})

it('reconnects Health without replacing an existing route', async () => {
  const trip = { ...buildCuratedTrip(VIRTUAL_ROUTES[0]), steps: 420, health: false }
  await setUserSettings(trip, 'walker')

  await press(connectButton())

  expect(await getUserSettings('walker')).toEqual({ ...trip, health: true, healthSetupCompleted: true })
  expect(mockNavigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Main' }] })
})

it('blocks duplicate actions and discards a native result after an account switch', async () => {
  let finishRequest
  AppleHealthKit.initHealthKit.mockImplementation((_, callback) => { finishRequest = callback })

  await act(async () => {
    const connect = connectButton().props.onPress
    const skip = skipButton().props.onPress
    const request = connect()
    await connect()
    await skip()
    mockUser = { uid: 'other-walker' }
    finishRequest(new Error('Unavailable'))
    await request
  })

  expect(AppleHealthKit.initHealthKit).toHaveBeenCalledTimes(1)
  expect(AsyncStorage.setItem).not.toHaveBeenCalled()
  expect(mockToast.show).not.toHaveBeenCalled()
  expect(mockNavigation.reset).not.toHaveBeenCalled()
  expect(skipButton().props.isDisabled).toBe(false)
})
