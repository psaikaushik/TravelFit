import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import moment from 'moment'
import renderer, { act } from 'react-test-renderer'
import NotificationSettings from '../src/screens/NotificationSettings'
import WeeklyStats from '../src/screens/WeeklyStats'
import { getStepsNumAtDate } from '../src/services/helpers'
import { clearNotifications, getNotificationPrefs, registerNotifications, saveNotificationPrefs } from '../src/services/notifications'

const mockToast = { show: jest.fn() }
let mockUid

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() })
}))
jest.mock('native-base', () => ({
  Box: 'Box',
  Text: 'Text',
  VStack: 'VStack',
  HStack: 'HStack',
  Flex: 'Flex',
  Switch: 'Switch',
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  useToast: () => mockToast
}))
jest.mock('../src/assets/icons/back.svg', () => 'BackIcon')
jest.mock('../src/services/helpers', () => ({
  getStepsNumAtDate: jest.fn(),
  prettifyNum: (steps) => String(steps),
  stepsToDistance: () => '0.0'
}))
jest.mock('../src/services/database', () => ({ getCurrentAccountId: () => mockUid }))
jest.mock('../src/services/notifications', () => ({
  clearNotifications: jest.fn(),
  getNotificationPrefs: jest.fn(),
  registerNotifications: jest.fn(),
  saveNotificationPrefs: jest.fn()
}))

const defaults = {
  enabled: false,
  milestoneAlerts: true,
  dailyGoalReminder: true,
  quietHoursStart: 22,
  quietHoursEnd: 7
}
const findSwitch = (tree, label) =>
  tree.root.findAllByType('Switch').find(({ props }) => props.accessibilityLabel === label)
const flush = () => new Promise((resolve) => setTimeout(resolve, 20))
const render = async (Screen) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } })
  let tree
  await act(async () => {
    tree = renderer.create(<QueryClientProvider client={client}><Screen /></QueryClientProvider>)
  })
  await act(flush)
  return tree
}

let tree
beforeEach(() => {
  jest.resetAllMocks()
  mockUid = 'walker'
  let saved = { ...defaults }
  getNotificationPrefs.mockImplementation(async () => saved)
  saveNotificationPrefs.mockImplementation(async (prefs) => { saved = prefs })
})
afterEach(() => act(() => tree?.unmount()))

test('master preference enables native registration, saves event preferences and clears delivered alerts when disabled', async () => {
  tree = await render(NotificationSettings)
  const master = () => findSwitch(tree, 'Toggle all notifications')
  const milestones = () => findSwitch(tree, 'Toggle milestone alerts')
  expect(master().props.isChecked).toBe(false)
  expect(milestones().props.isDisabled).toBe(true)
  await act(async () => { await master().props.onToggle(true) })
  expect(registerNotifications).toHaveBeenCalledTimes(1)
  expect(milestones().props.isDisabled).toBe(false)
  await act(async () => { await milestones().props.onToggle(false) })
  expect(saveNotificationPrefs).toHaveBeenLastCalledWith({ ...defaults, enabled: true, milestoneAlerts: false }, 'walker')
  await act(async () => { await master().props.onToggle(false) })
  expect(clearNotifications).toHaveBeenCalledTimes(1)
  expect(saveNotificationPrefs).toHaveBeenLastCalledWith({ ...defaults, enabled: false, milestoneAlerts: false }, 'walker')
})

test('notification storage failure restores the previous setting and keeps native side effects untouched', async () => {
  saveNotificationPrefs.mockRejectedValueOnce(new Error('Storage unavailable'))
  tree = await render(NotificationSettings)
  const master = () => findSwitch(tree, 'Toggle all notifications')
  await act(async () => { await master().props.onToggle(true) })
  expect(master().props.isChecked).toBe(false)
  expect(registerNotifications).not.toHaveBeenCalled()
  expect(mockToast.show).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }))
})

test('month statistics include today and yesterday, plus the earlier four weeks', async () => {
  const today = moment().startOf('day')
  getStepsNumAtDate.mockResolvedValue([
    { startDate: today.clone().subtract(29, 'days').toISOString(), value: 150 },
    { startDate: today.clone().subtract(1, 'day').toISOString(), value: 275 },
    { startDate: today.toISOString(), value: 360 }
  ])
  tree = await render(WeeklyStats)
  const walkTexts = () => tree.root.findAllByType('Text').map(({ props }) => props.children)
  expect(walkTexts()).toContain('635')
  act(() => tree.root.findAllByType('Pressable').find(({ props }) =>
    props.accessibilityLabel === 'Show month stats').props.onPress())
  expect(walkTexts()).toContain('30-Day Total')
  expect(walkTexts()).toContain('785')
  expect(walkTexts()).toContain('635')
})

test('statistics show an empty state when Health samples are unavailable', async () => {
  getStepsNumAtDate.mockResolvedValueOnce(null).mockResolvedValueOnce([])
  tree = await render(WeeklyStats)
  const walkTexts = () => tree.root.findAllByType('Text').map(({ props }) => props.children)
  const empty = 'No Apple Health step samples for this period. Check access in the Health app.'
  expect(walkTexts()).toContain(empty)
  expect(walkTexts()).not.toContain('Total Steps')
  act(() => tree.root.findAllByType('Pressable').find(({ props }) =>
    props.accessibilityLabel === 'Show month stats').props.onPress())
  expect(walkTexts()).toContain(empty)
  expect(walkTexts()).not.toContain('30-Day Total')
})

test('native registration failure leaves the saved preference visible', async () => {
  registerNotifications.mockImplementation(() => { throw new Error('Native service unavailable') })
  tree = await render(NotificationSettings)
  const master = () => findSwitch(tree, 'Toggle all notifications')
  await act(async () => { await master().props.onToggle(true) })
  expect(saveNotificationPrefs).toHaveBeenCalledWith({ ...defaults, enabled: true }, 'walker')
  expect(master().props.isChecked).toBe(true)
  expect(mockToast.show).toHaveBeenCalledWith(expect.objectContaining({ description: expect.stringMatching(/Preference saved/) }))
})

test('an in-flight preference write disables switches and ignores a duplicate toggle', async () => {
  let finishSave
  saveNotificationPrefs.mockImplementationOnce(() => new Promise((resolve) => { finishSave = resolve }))
  tree = await render(NotificationSettings)
  const master = () => findSwitch(tree, 'Toggle all notifications')
  let toggling
  act(() => { toggling = master().props.onToggle(true) })
  expect(master().props.isDisabled).toBe(true)
  await act(async () => { await master().props.onToggle(true) })
  expect(saveNotificationPrefs).toHaveBeenCalledTimes(1)
  await act(async () => {
    finishSave()
    await toggling
  })
  expect(master().props.isDisabled).toBe(false)
  expect(master().props.isChecked).toBe(true)
})

test('account switch during a preference write does not alter replacement cache or register notifications', async () => {
  let finishSave
  saveNotificationPrefs.mockImplementationOnce(() => new Promise((resolve) => { finishSave = resolve }))
  tree = await render(NotificationSettings)
  const client = tree.root.findByType(QueryClientProvider).props.client
  const master = () => findSwitch(tree, 'Toggle all notifications')
  let toggling
  act(() => { toggling = master().props.onToggle(true) })
  expect(saveNotificationPrefs).toHaveBeenCalledWith({ ...defaults, enabled: true }, 'walker')
  mockUid = 'replacement'
  client.setQueryData(['notification-prefs', mockUid], { ...defaults })
  await act(async () => {
    tree.update(<QueryClientProvider client={client}><NotificationSettings /></QueryClientProvider>)
    finishSave()
    await toggling
  })
  expect(registerNotifications).not.toHaveBeenCalled()
  expect(client.getQueryData(['notification-prefs', 'replacement'])).toEqual(defaults)
  expect(master().props.isChecked).toBe(false)
})
