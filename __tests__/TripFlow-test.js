import React from 'react'
import { Alert, Pressable } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import AppleHealthKit from 'react-native-health'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import renderer, { act } from 'react-test-renderer'
import Trip from '../src/screens/Trip'
import TripHistory from '../src/screens/TripHistory'
import { buildCuratedTrip, VIRTUAL_ROUTES } from '../src/data/curatedRoutes'
import { getUserSettings, setUserSettings } from '../src/services/database'
import { archiveCurrentTrip, deleteTripFromHistory, getTripHistory } from '../src/services/tripHistory'
import { checkFlow, getTripProgressIndex, updateProgress } from '../src/services/helpers'

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
jest.mock('@react-navigation/native', () => ({ useNavigation: () => mockNavigation }))
jest.mock('native-base', () => ({
  Box: 'Box',
  HStack: 'HStack',
  Button: 'Button',
  Flex: 'Flex',
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  Text: 'Text',
  VStack: 'VStack',
  useToast: () => mockToast
}))
jest.mock('../src/assets/icons/back.svg', () => 'BackIcon')
jest.mock('react-native-health', () => ({ getDailyStepCountSamples: jest.fn() }))
jest.mock('../src/services/maps', () => ({}))
jest.mock('../src/services/subscription', () => ({ hasActiveSubscription: jest.fn() }))

const firstRoute = VIRTUAL_ROUTES[0]
const secondRoute = VIRTUAL_ROUTES[1]
const startedTime = '2026-11-23T12:00:00.000Z'
const currentTrip = {
  ...buildCuratedTrip(firstRoute),
  tripId: startedTime,
  startedTime,
  health: true,
  healthSetupCompleted: true,
  steps: 750,
  cities: []
}

let screen
let queryClient
let alert

beforeEach(async () => {
  await AsyncStorage.clear()
  jest.clearAllMocks()
  mockUser = { uid: 'walker' }
  mockNavigation = { canGoBack: jest.fn(() => true), goBack: jest.fn(), reset: jest.fn() }
  mockToast = { show: jest.fn() }
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  queryClient = new QueryClient({
    defaultOptions: { queries: { cacheTime: Infinity, retry: false, staleTime: Infinity } },
    logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() }
  })
})

afterEach(() => {
  if (screen) act(() => screen.unmount())
  screen = undefined
  queryClient.clear()
  alert.mockRestore()
})

const mountPicker = async (settings) => {
  await setUserSettings(settings, mockUser.uid)
  queryClient.setQueryData(['settings'], settings)
  await act(async () => {
    screen = renderer.create(
      <QueryClientProvider client={queryClient}><Trip /></QueryClientProvider>
    )
  })
}

const routeButton = (route) => screen.root.findAllByType(Pressable).find(({ props }) =>
  props.testID === `route-start-${route.id}`)

const select = async (route) => {
  const button = routeButton(route)
  await act(async () => { await button.props.onPress() })
}

const alertAction = (name) => {
  expect(alert).toHaveBeenCalledWith(
    'Start a new route?',
    expect.stringContaining('zero steps'),
    expect.any(Array)
  )
  return alert.mock.calls[alert.mock.calls.length - 1][2].find(({ text }) => text === name)
}

const confirm = async () => {
  await act(async () => { await alertAction('Start new route').onPress() })
}

it('starts a first route directly and preserves the account’s Health choice', async () => {
  await mountPicker({ health: false, healthSetupCompleted: true })
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries')
  const button = routeButton(firstRoute)
  expect(button.props).toMatchObject({
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: `Start ${firstRoute.title} at zero steps`,
    accessibilityState: { disabled: false, busy: false }
  })

  await act(async () => { await button.props.onAccessibilityTap() })

  expect(alert).not.toHaveBeenCalled()
  const saved = await getUserSettings('walker')
  expect(saved).toMatchObject({
    curatedRouteId: firstRoute.id,
    health: false,
    healthSetupCompleted: true,
    steps: 0
  })
  expect(saved.startedTime).toBe(saved.tripId)
  expect(await getTripHistory('walker')).toEqual([])
  expect(invalidate).toHaveBeenCalledWith(['settings'])
  expect(invalidate).toHaveBeenCalledWith(['stats'])
  expect(mockNavigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Main' }] })
})

it('leaves the active trip intact on cancel and archives it on confirmation', async () => {
  await mountPicker(currentTrip)

  await select(secondRoute)
  const cancel = alertAction('Cancel')
  expect(cancel.style).toBe('cancel')
  await act(async () => { await cancel.onPress?.() })

  expect(await getUserSettings('walker')).toEqual(currentTrip)
  expect(await getTripHistory('walker')).toEqual([])
  expect(mockNavigation.reset).not.toHaveBeenCalled()

  await select(secondRoute)
  await confirm()

  expect(await getTripHistory('walker')).toEqual([
    expect.objectContaining({ id: `trip_${startedTime}`, steps: 750, startedTime })
  ])
  expect(await getUserSettings('walker')).toMatchObject({
    curatedRouteId: secondRoute.id,
    health: true,
    steps: 0
  })
  expect(mockNavigation.reset).toHaveBeenCalledTimes(1)
})

it('keeps the active route on storage failure and deduplicates history when retried', async () => {
  await mountPicker(currentTrip)
  const write = AsyncStorage.setItem.getMockImplementation()
  AsyncStorage.setItem
    .mockRejectedValueOnce(new Error('Trip history write failed'))

  await select(secondRoute)
  await confirm()

  expect(await getUserSettings('walker')).toEqual(currentTrip)
  expect(await getTripHistory('walker')).toEqual([])
  expect(mockToast.show).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }))
  expect(mockNavigation.reset).not.toHaveBeenCalled()
  expect(routeButton(secondRoute).props.disabled).toBe(false)

  AsyncStorage.setItem
    .mockImplementationOnce(write)
    .mockRejectedValueOnce(new Error('Trip settings write failed'))
  await select(secondRoute)
  await confirm()

  expect(await getUserSettings('walker')).toEqual(currentTrip)
  expect(await getTripHistory('walker')).toHaveLength(1)
  expect(mockToast.show).toHaveBeenCalledTimes(2)
  expect(mockNavigation.reset).not.toHaveBeenCalled()

  await select(secondRoute)
  await confirm()

  expect(await getTripHistory('walker')).toHaveLength(1)
  expect(await getUserSettings('walker')).toMatchObject({ curatedRouteId: secondRoute.id, steps: 0 })
  expect(mockNavigation.reset).toHaveBeenCalledTimes(1)
})

it('discards a replacement confirmation opened by a previous account', async () => {
  await mountPicker(currentTrip)
  await select(secondRoute)

  mockUser = { uid: 'other-walker' }
  const otherTrip = { ...currentTrip, steps: 80 }
  await setUserSettings(otherTrip, mockUser.uid)
  AsyncStorage.setItem.mockClear()

  await confirm()

  expect(AsyncStorage.setItem).not.toHaveBeenCalled()
  expect(await getUserSettings('other-walker')).toEqual(otherTrip)
  expect(await getTripHistory('other-walker')).toEqual([])
  expect(mockNavigation.reset).not.toHaveBeenCalled()
})

it('keeps navigation with the current account if auth changes while refresh is pending', async () => {
  await mountPicker({ health: true, healthSetupCompleted: true })
  let finishRefresh
  const refreshPending = new Promise((resolve) => { finishRefresh = resolve })
  let firstInvalidation
  const invalidationStarted = new Promise((resolve) => { firstInvalidation = resolve })
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries').mockImplementation(() => {
    firstInvalidation()
    return refreshPending
  })

  await act(async () => {
    const press = routeButton(firstRoute).props.onPress()
    await invalidationStarted
    mockUser = { uid: 'other-walker' }
    finishRefresh()
    await press
  })

  expect(mockNavigation.reset).not.toHaveBeenCalled()
  expect(await getUserSettings('other-walker')).toEqual({})
  invalidate.mockRestore()
})


it('completes a route, resumes it from storage, then starts over and removes the old trip', async () => {
  await mountPicker({ health: true, healthSetupCompleted: true })
  await select(firstRoute)
  const started = await getUserSettings()
  expect(started).toMatchObject({ curatedRouteId: firstRoute.id, steps: 0 })
  expect(started.badges.every((badge) => badge.progress === 0)).toBe(true)

  const steps = Math.ceil((started.distance + 0.02) * 1200)
  const samples = AppleHealthKit.getDailyStepCountSamples.mockImplementation((_, callback) =>
    callback(null, [{ value: steps }])
  )
  let status
  await act(async () => {
    status = await updateProgress(queryClient)
  })
  expect(status).toMatchObject({ status: 'complete' })
  expect(status.alerts.map(({ name }) => name)).toEqual(started.badges.map(({ name }) => name))
  expect(samples).toHaveBeenCalledWith({ startDate: started.startedTime }, expect.any(Function))

  const completed = await getUserSettings()
  expect(completed).toMatchObject({ steps, completed: expect.any(String) })
  expect(completed.badges.every((badge) => badge.progress === 100)).toBe(true)
  expect(getTripProgressIndex(steps, completed.distance, completed.route)).toBe(completed.route.length - 1)
  await expect(checkFlow(mockUser)).resolves.toBe('Main')
  await expect(updateProgress()).resolves.toEqual({ status: 'complete' })
  expect(samples).toHaveBeenCalledTimes(1)

  act(() => screen.unmount())
  await mountPicker(completed)
  await select(secondRoute)
  expect(alert).not.toHaveBeenCalled()
  expect(await getUserSettings()).toMatchObject({ curatedRouteId: secondRoute.id, steps: 0 })
  const history = await getTripHistory()
  expect(history).toEqual([
    expect.objectContaining({ completed: completed.completed, steps, badges: completed.badges.length })
  ])
  await deleteTripFromHistory(history[0].id)
  await expect(getTripHistory()).resolves.toEqual([])
})

it('keeps a history entry visible and reports a failed removal when device storage rejects the write', async () => {
  const trip = await archiveCurrentTrip(currentTrip)
  queryClient.setQueryData(['trip-history', mockUser.uid], [trip])
  await act(async () => {
    screen = renderer.create(
      <QueryClientProvider client={queryClient}><TripHistory /></QueryClientProvider>
    )
  })
  expect(screen.root.findAllByType('Text').map(({ props }) => props.children)).toContain('Archived')
  AsyncStorage.setItem.mockRejectedValueOnce(new Error('Trip history write failed'))
  await act(async () => {
    await screen.root.findByProps({ accessibilityLabel: 'Remove this trip from history' }).props.onPress()
  })
  expect(await getTripHistory(mockUser.uid)).toEqual([trip])
  expect(mockToast.show).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }))
  expect(mockToast.show).toHaveBeenCalledTimes(1)
  expect(screen.root.findByProps({ accessibilityLabel: 'Remove this trip from history' })).toBeTruthy()
})

it('does not overwrite an archived route when a concurrent history removal follows it', async () => {
  const original = await archiveCurrentTrip(currentTrip, mockUser.uid)
  const replacement = { ...currentTrip, tripId: 'second-trip' }
  const [archived] = await Promise.all([
    archiveCurrentTrip(replacement, mockUser.uid),
    deleteTripFromHistory(original.id, mockUser.uid)
  ])
  expect(await getTripHistory(mockUser.uid)).toEqual([archived])
})

it('does not write history if the account changes during a pending read', async () => {
  const original = await archiveCurrentTrip(currentTrip, mockUser.uid)
  let finishRead
  AsyncStorage.getItem.mockImplementationOnce(() => new Promise((resolve) => { finishRead = resolve }))
  const pending = deleteTripFromHistory(original.id, mockUser.uid)
  while (!finishRead) await Promise.resolve()
  mockUser = { uid: 'replacement' }
  finishRead(JSON.stringify([original]))
  await expect(pending).resolves.toBeUndefined()
  expect(await getTripHistory('replacement')).toEqual([])
  mockUser = { uid: 'walker' }
  expect(await getTripHistory('walker')).toEqual([original])
})

it('leaves history untouched when reading it for removal fails', async () => {
  const original = await archiveCurrentTrip(currentTrip, mockUser.uid)
  AsyncStorage.setItem.mockClear()
  AsyncStorage.getItem.mockRejectedValueOnce(new Error('Trip history read failed'))
  await expect(deleteTripFromHistory(original.id, mockUser.uid)).rejects.toThrow('Trip history read failed')
  expect(AsyncStorage.setItem).not.toHaveBeenCalled()
  expect(await getTripHistory(mockUser.uid)).toEqual([original])
})
