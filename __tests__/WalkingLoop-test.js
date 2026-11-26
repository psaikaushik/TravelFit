import AppleHealthKit from 'react-native-health'
import { buildCuratedTrip, VIRTUAL_ROUTES } from '../src/data/curatedRoutes'
import { getCurrentAccountId, getData, getUserData, getUserSettings, setUserSettings, storeData } from '../src/services/database'
import { checkFlow, getStepsNumAtDate, getTripProgressIndex, updateProgress } from '../src/services/helpers'
import { getStreakSummary, setDailyGoal } from '../src/services/streak'

jest.mock('react-native-health', () => ({ getDailyStepCountSamples: jest.fn() }))
jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn() }))
jest.mock('../src/services/database', () => ({
  getCurrentAccountId: jest.fn(),
  getData: jest.fn(),
  getUserData: jest.fn(),
  getUserSettings: jest.fn(),
  setUserSettings: jest.fn(),
  storeData: jest.fn()
}))
jest.mock('../src/services/subscription', () => ({ hasActiveSubscription: jest.fn() }))
jest.mock('../src/services/maps', () => ({}))

const startedTime = '2026-11-23T12:00:00.000Z'

beforeEach(() => {
  jest.clearAllMocks()
  getCurrentAccountId.mockReturnValue('walker')
  getUserData.mockResolvedValue({ createdTime: '2026-01-01T00:00:00.000Z' })
})

it('opens the route selector after skipping Health and rejects legacy map data', async () => {
  getUserSettings.mockResolvedValue({ healthSetupCompleted: true, health: false, route: [{}], distance: 3 })
  await expect(checkFlow({ uid: 'walker' })).resolves.toBe('Trip')
  await expect(getStepsNumAtDate(startedTime)).resolves.toBeNull()
  expect(AppleHealthKit.getDailyStepCountSamples).not.toHaveBeenCalled()
})

it('reads from the trip start and unlocks a curated landmark', async () => {
  const trip = buildCuratedTrip(VIRTUAL_ROUTES[0])
  const steps = Math.ceil((trip.badges[0].distance + 0.02) * 1200)
  getUserSettings.mockResolvedValue({ ...trip, startedTime, health: true, steps: 0 })
  AppleHealthKit.getDailyStepCountSamples.mockImplementation((_, callback) => callback(null, [{ value: steps }]))

  await expect(updateProgress()).resolves.toMatchObject({
    status: 'ready',
    alerts: [{ name: trip.badges[0].name }]
  })
  expect(AppleHealthKit.getDailyStepCountSamples).toHaveBeenCalledWith({ startDate: startedTime }, expect.any(Function))
  expect(setUserSettings).toHaveBeenCalledWith(expect.objectContaining({ steps }), 'walker')
  expect(getTripProgressIndex(steps, trip.distance, trip.route)).toBeGreaterThan(0)
})

it('keeps saved progress when HealthKit supplies no samples', async () => {
  const trip = buildCuratedTrip(VIRTUAL_ROUTES[1])
  getUserSettings.mockResolvedValue({ ...trip, startedTime, health: true, steps: 1234 })
  AppleHealthKit.getDailyStepCountSamples.mockImplementation((_, callback) => callback(null, []))

  await expect(updateProgress()).resolves.toMatchObject({ status: 'empty' })
  expect(setUserSettings).not.toHaveBeenCalled()
})

it('discards samples returned after an account change', async () => {
  const trip = buildCuratedTrip(VIRTUAL_ROUTES[0])
  getUserSettings.mockResolvedValue({ ...trip, startedTime, health: true, steps: 0 })
  AppleHealthKit.getDailyStepCountSamples.mockImplementation((_, callback) => {
    getCurrentAccountId.mockReturnValue('other-walker')
    callback(null, [{ value: 4000 }])
  })

  await expect(updateProgress()).resolves.toMatchObject({ status: 'unavailable' })
  expect(setUserSettings).not.toHaveBeenCalled()
})

it('updates current goal progress when a walker raises a goal they already reached', async () => {
  const now = new Date().toISOString()
  let streak = JSON.stringify({ dailyGoal: 5000, goalReachedToday: true, goalReachedDate: now })
  getData.mockImplementation(async () => streak)
  storeData.mockImplementation(async (_key, value) => { streak = value })
  getUserSettings.mockResolvedValue({ health: true })
  AppleHealthKit.getDailyStepCountSamples.mockImplementation((_, callback) => callback(null, [
    { startDate: now, value: 6000 }
  ]))

  await expect(getStreakSummary()).resolves.toMatchObject({ goalReachedToday: true, progress: 100 })
  await setDailyGoal(20000)
  await expect(getStreakSummary()).resolves.toMatchObject({ goalReachedToday: false, progress: 30 })
})
