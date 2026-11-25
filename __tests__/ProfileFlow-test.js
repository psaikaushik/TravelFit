import React from 'react'
import { Alert } from 'react-native'
import renderer, { act } from 'react-test-renderer'
import Profile from '../src/screens/Profile'
import { clearLocalAccountData } from '../src/services/database'
import { deleteAccount } from '../src/services/api'
import { clearNotifications } from '../src/services/notifications'
import { finishPendingAccountDeletion } from '../src/services/users'

const mockNavigation = { reset: jest.fn(), navigate: jest.fn() }
const mockToast = { show: jest.fn() }
const mockQueryClient = { clear: jest.fn() }
const mockUser = { uid: 'walker', email: 'walker@example.com', providerData: [], getIdToken: jest.fn() }
const mockAuth = {
  currentUser: mockUser,
  signOut: jest.fn()
}
const mockPerformAppleRequest = jest.fn()

jest.mock('@react-native-firebase/auth', () => () => mockAuth)
jest.mock('@invertase/react-native-apple-authentication', () => ({
  appleAuth: { Error: { CANCELED: 'canceled' }, performRequest: mockPerformAppleRequest }
}))
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useIsFocused: () => false
}))
jest.mock('@tanstack/react-query', () => ({
  useQuery: ([key]) => ({ data: key === 'profile' ? { name: 'Walker' } : {} }),
  useQueryClient: () => mockQueryClient
}))
jest.mock('../src/services/database', () => ({ clearLocalAccountData: jest.fn(), getUserData: jest.fn() }))
jest.mock('../src/services/api', () => ({ deleteAccount: jest.fn() }))
jest.mock('../src/services/notifications', () => ({ clearNotifications: jest.fn() }))
jest.mock('../src/services/streak', () => ({ getStreakData: jest.fn(), setDailyGoal: jest.fn() }))
jest.mock('../src/services/users', () => ({ finishPendingAccountDeletion: jest.fn() }))
jest.mock('../src/components/TabScreen', () => ({ children }) => children)
jest.mock('native-base', () => ({
  Button: 'Button',
  Container: 'Container',
  Text: 'Text',
  Box: 'Box',
  VStack: 'VStack',
  HStack: 'HStack',
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  useToast: () => mockToast
}))

let tree
let alert
const press = (label) => act(async () => {
  await tree.root.findAllByType('Button').find(({ props }) => props.children === label).props.onPress()
})
const confirm = () => act(async () => {
  const [, , actions] = alert.mock.calls[0]
  await actions.find(({ style }) => style === 'destructive').onPress()
})

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.currentUser = mockUser
  mockUser.providerData = []
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  mockAuth.signOut.mockImplementation(async () => { mockAuth.currentUser = null })
  mockAuth.currentUser.getIdToken.mockResolvedValue('test-token')
  act(() => { tree = renderer.create(<Profile />) })
})

afterEach(() => {
  act(() => tree.unmount())
  alert.mockRestore()
})

test('sign out clears user caches and opens Welcome', async () => {
  await press('Sign Out')
  expect(mockAuth.signOut).toHaveBeenCalledTimes(1)
  expect(mockQueryClient.clear).toHaveBeenCalledTimes(1)
  expect(clearNotifications).toHaveBeenCalledTimes(1)
  expect(clearLocalAccountData).not.toHaveBeenCalled()
  expect(mockNavigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Welcome' }] })
})

test('confirmed account deletion clears server then local account state', async () => {
  deleteAccount.mockResolvedValue()
  await press('Delete Account')
  expect(deleteAccount).not.toHaveBeenCalled()
  await confirm()
  expect(mockUser.getIdToken).toHaveBeenCalledWith(true)
  expect(deleteAccount).toHaveBeenCalledTimes(1)
  expect(deleteAccount).toHaveBeenCalledWith('walker')
  expect(clearLocalAccountData).toHaveBeenCalledWith('walker')
  expect(mockAuth.signOut).toHaveBeenCalledTimes(1)
  expect(mockQueryClient.clear).toHaveBeenCalledTimes(1)
  expect(mockNavigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Welcome' }] })
})

test('stale sign-in preserves the account and displays the reauthentication message', async () => {
  const message = 'Sign out and sign in again before deleting your account.'
  deleteAccount.mockRejectedValue({ code: 'functions/failed-precondition', message })
  await press('Delete Account')
  await confirm()
  expect(mockToast.show).toHaveBeenCalledWith({ status: 'error', description: message })
  expect(clearLocalAccountData).not.toHaveBeenCalled()
  expect(mockAuth.signOut).not.toHaveBeenCalled()
  expect(mockNavigation.reset).not.toHaveBeenCalled()
})

test('an interrupted Apple account deletion finishes without revoking Apple a second time', async () => {
  mockUser.providerData = [{ providerId: 'apple.com' }]
  finishPendingAccountDeletion.mockImplementation(async () => {
    mockAuth.currentUser = null
    return true
  })
  await press('Delete Account')
  await confirm()
  expect(finishPendingAccountDeletion).toHaveBeenCalledWith(mockUser.uid)
  expect(mockPerformAppleRequest).not.toHaveBeenCalled()
  expect(mockNavigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Welcome' }] })
})

test('account switch invalidates a pending delete confirmation', async () => {
  await press('Delete Account')
  const originalUser = mockAuth.currentUser
  mockAuth.currentUser = { ...originalUser, uid: 'another-walker' }
  try {
    await confirm()
    expect(deleteAccount).not.toHaveBeenCalled()
    expect(clearLocalAccountData).not.toHaveBeenCalled()
    expect(mockNavigation.reset).not.toHaveBeenCalled()
  } finally {
    mockAuth.currentUser = originalUser
  }
})

test('local notification cleanup failure cannot prevent sign-out navigation', async () => {
  clearNotifications.mockImplementation(() => { throw new Error('Native notification service unavailable') })
  await press('Sign Out')
  expect(mockAuth.signOut).toHaveBeenCalledTimes(1)
  expect(mockQueryClient.clear).toHaveBeenCalledTimes(1)
  expect(mockNavigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Welcome' }] })
})

test('account switch during token refresh stops the pending deletion', async () => {
  await press('Delete Account')
  const originalUser = mockAuth.currentUser
  originalUser.getIdToken.mockImplementation(async () => {
    mockAuth.currentUser = { ...originalUser, uid: 'another-walker' }
    return 'test-token'
  })
  try {
    await confirm()
    expect(originalUser.getIdToken).toHaveBeenCalledWith(true)
    expect(deleteAccount).not.toHaveBeenCalled()
    expect(clearLocalAccountData).not.toHaveBeenCalled()
  } finally {
    mockAuth.currentUser = originalUser
  }
})

test('deletion finishing after an account switch leaves the replacement session alone', async () => {
  const replacement = { ...mockUser, uid: 'another-walker' }
  deleteAccount.mockImplementation(async () => { mockAuth.currentUser = replacement })
  await press('Delete Account')
  await confirm()
  expect(deleteAccount).toHaveBeenCalledWith(mockUser.uid)
  expect(clearLocalAccountData).toHaveBeenCalledWith(mockUser.uid)
  expect(mockAuth.currentUser).toBe(replacement)
  expect(mockAuth.signOut).not.toHaveBeenCalled()
  expect(mockNavigation.reset).not.toHaveBeenCalled()
})
