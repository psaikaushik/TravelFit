import { Alert } from 'react-native'
import { deleteAccount } from '../src/services/api'
import { clearLocalAccountData, getCurrentAccountId, setUserData } from '../src/services/database'
import { checkFlow } from '../src/services/helpers'
import { clearNotifications } from '../src/services/notifications'
import { getAccountEntryRoute } from '../src/services/users'

const mockRef = jest.fn()
const mockSignOut = jest.fn()
const user = { uid: 'walker' }
const profile = { name: 'Demo Walker', email: 'walker@example.com', createdTime: '2026-11-25T00:00:00Z' }
const denied = Object.assign(new Error('Permission denied'), { code: 'database/permission-denied' })

jest.mock('@react-native-firebase/database', () => () => ({ ref: mockRef }))
jest.mock('@react-native-firebase/auth', () => () => ({ signOut: mockSignOut }))
jest.mock('../src/services/api', () => ({ deleteAccount: jest.fn() }))
jest.mock('../src/services/database', () => ({
  clearLocalAccountData: jest.fn(),
  getCurrentAccountId: jest.fn(),
  setUserData: jest.fn()
}))
jest.mock('../src/services/helpers', () => ({ checkFlow: jest.fn() }))
jest.mock('../src/services/notifications', () => ({ clearNotifications: jest.fn() }))

const snapshot = (value) => ({ once: async () => ({ val: () => value }) })
const rejection = (error) => ({ once: async () => { throw error } })

beforeEach(() => {
  jest.resetAllMocks()
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  getCurrentAccountId.mockReturnValue(user.uid)
  mockSignOut.mockImplementation(async () => { getCurrentAccountId.mockReturnValue(undefined) })
})

afterEach(() => jest.restoreAllMocks())

test('healthy sign-in restores the account without looking for a deletion marker', async () => {
  mockRef.mockReturnValue(snapshot(profile))
  checkFlow.mockResolvedValue('Main')
  await expect(getAccountEntryRoute(user)).resolves.toBe('Main')
  expect(mockRef.mock.calls).toEqual([['users/walker']])
  expect(setUserData).toHaveBeenCalledWith(profile, user.uid)
  expect(deleteAccount).not.toHaveBeenCalled()
})

test('an offline profile read does not fall through to account deletion', async () => {
  const offline = Object.assign(new Error('Offline'), { code: 'database/network-error' })
  mockRef.mockReturnValue(rejection(offline))
  await expect(getAccountEntryRoute(user)).rejects.toBe(offline)
  expect(mockRef.mock.calls).toEqual([['users/walker']])
  expect(deleteAccount).not.toHaveBeenCalled()
})

test('permission denial without a readable marker preserves the original profile error', async () => {
  mockRef.mockReturnValueOnce(rejection(denied)).mockReturnValueOnce(rejection({ code: 'database/permission-denied' }))
  await expect(getAccountEntryRoute(user)).rejects.toBe(denied)
  expect(mockRef.mock.calls).toEqual([['users/walker'], ['account_deletions/walker']])
  expect(deleteAccount).not.toHaveBeenCalled()
})

test('a confirmed deletion marker finishes deletion and returns to Welcome', async () => {
  mockRef.mockReturnValueOnce(rejection(denied)).mockReturnValueOnce(snapshot(true))
  await expect(getAccountEntryRoute(user)).resolves.toBe('Welcome')
  expect(deleteAccount).toHaveBeenCalledWith(user.uid)
  expect(clearLocalAccountData).toHaveBeenCalledWith(user.uid)
  expect(mockSignOut).toHaveBeenCalledTimes(1)
  expect(clearNotifications).toHaveBeenCalledTimes(1)
  expect(Alert.alert).toHaveBeenCalledWith('Account deleted', 'TravelFit finished deleting your account.')
  expect(setUserData).not.toHaveBeenCalled()
  expect(checkFlow).not.toHaveBeenCalled()
})

test('a transient failure while finishing deletion can be retried without starting a normal session', async () => {
  mockRef.mockReturnValueOnce(rejection(denied)).mockReturnValueOnce(snapshot(true))
  deleteAccount.mockRejectedValueOnce({ code: 'functions/unavailable' })
  await expect(getAccountEntryRoute(user)).rejects.toMatchObject({ code: 'account/deletion-pending' })
  expect(clearLocalAccountData).not.toHaveBeenCalled()
  expect(mockSignOut).not.toHaveBeenCalled()
  expect(checkFlow).not.toHaveBeenCalled()
})

test('deletion finishing after an account switch leaves the new session alone', async () => {
  mockRef.mockReturnValueOnce(rejection(denied)).mockReturnValueOnce(snapshot(true))
  deleteAccount.mockImplementationOnce(async () => { getCurrentAccountId.mockReturnValue('new-walker') })
  await expect(getAccountEntryRoute(user)).resolves.toBeNull()
  expect(clearLocalAccountData).toHaveBeenCalledWith(user.uid)
  expect(mockSignOut).not.toHaveBeenCalled()
  expect(clearNotifications).not.toHaveBeenCalled()
  expect(Alert.alert).not.toHaveBeenCalled()
})
