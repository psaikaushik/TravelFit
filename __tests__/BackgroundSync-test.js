import React from 'react'
import { AppState, NativeAppEventEmitter } from 'react-native'
import renderer, { act } from 'react-test-renderer'
import { Notifications } from 'react-native-notifications'
import useBackgroundTasks from '../src/services/background'
import { getCurrentAccountId } from '../src/services/database'
import { updateProgress } from '../src/services/helpers'
import { getNotificationPrefs, isInQuietHours } from '../src/services/notifications'
import { checkDailyGoal } from '../src/services/streak'

const mockQueryClient = { invalidateQueries: jest.fn() }

jest.mock('react-native', () => ({
  AppState: { addEventListener: jest.fn() },
  NativeAppEventEmitter: { addListener: jest.fn() }
}))
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => mockQueryClient
}))
jest.mock('react-native-notifications', () => ({
  Notifications: { postLocalNotification: jest.fn() }
}))
jest.mock('../src/services/helpers', () => ({ updateProgress: jest.fn() }))
jest.mock('../src/services/database', () => ({ getCurrentAccountId: jest.fn() }))
jest.mock('../src/services/notifications', () => ({
  getNotificationPrefs: jest.fn(),
  isInQuietHours: jest.fn()
}))
jest.mock('../src/services/streak', () => ({ checkDailyGoal: jest.fn() }))

const SyncHarness = () => {
  useBackgroundTasks()
  return null
}

let tree
const mount = async () => {
  await act(async () => { tree = renderer.create(<SyncHarness />) })
}

const delayInvalidations = () => {
  let complete
  const pending = new Promise((resolve) => { complete = resolve })
  mockQueryClient.invalidateQueries
    .mockReturnValueOnce(pending)
    .mockReturnValueOnce(pending)
  return complete
}

beforeEach(() => {
  jest.resetAllMocks()
  AppState.addEventListener.mockReturnValue({ remove: jest.fn() })
  NativeAppEventEmitter.addListener.mockReturnValue({ remove: jest.fn() })
  getCurrentAccountId.mockReturnValue('walker')
  updateProgress.mockResolvedValue({ status: 'ready', alerts: [{ name: 'Torpedo Wharf' }] })
  checkDailyGoal.mockResolvedValue({ isFirstTimeToday: true, dailyGoal: 10000 })
  getNotificationPrefs.mockResolvedValue({ enabled: true, milestoneAlerts: true, dailyGoalReminder: true })
  isInQuietHours.mockReturnValue(false)
  mockQueryClient.invalidateQueries.mockResolvedValue()
})

afterEach(() => {
  if (tree) act(() => tree.unmount())
  tree = undefined
})

it('posts opted-in alerts for a device session that still belongs to the walker', async () => {
  await mount()

  expect(getNotificationPrefs).toHaveBeenCalledWith('walker')
  expect(Notifications.postLocalNotification).toHaveBeenCalledWith(expect.objectContaining({ category: 'BADGE' }))
  expect(Notifications.postLocalNotification).toHaveBeenCalledWith(expect.objectContaining({ category: 'GOAL' }))
})

it('drops milestone and goal alerts when the account switches during query refresh', async () => {
  const finishRefresh = delayInvalidations()
  await mount()
  expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(2)
  expect(Notifications.postLocalNotification).not.toHaveBeenCalled()

  getCurrentAccountId.mockReturnValue('other-walker')
  await act(async () => { finishRefresh() })

  expect(Notifications.postLocalNotification).not.toHaveBeenCalled()
})

it('performs one trailing sync when Health updates and foreground events arrive after the step snapshot', async () => {
  const finishRefresh = delayInvalidations()
  await mount()
  expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(2)
  expect(updateProgress).toHaveBeenCalledTimes(1)

  const healthChanged = NativeAppEventEmitter.addListener.mock.calls[0][1]
  const stateChanged = AppState.addEventListener.mock.calls[0][1]
  await act(async () => {
    await healthChanged()
    await stateChanged('active')
  })
  expect(updateProgress).toHaveBeenCalledTimes(1)

  await act(async () => { finishRefresh() })
  expect(updateProgress).toHaveBeenCalledTimes(2)
})
