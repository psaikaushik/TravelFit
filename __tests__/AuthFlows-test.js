import React from 'react'
import renderer, { act } from 'react-test-renderer'
import Login from '../src/screens/Login'
import SignUp from '../src/screens/SignUp'
import Reset from '../src/screens/Reset'
import { getAccountEntryRoute } from '../src/services/users'

const mockAuth = {
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn()
}
const mockNavigation = { reset: jest.fn(), navigate: jest.fn(), goBack: jest.fn() }
const mockToast = { show: jest.fn() }

jest.mock('@react-native-firebase/auth', () => () => mockAuth)
jest.mock('@react-navigation/native', () => ({ useNavigation: () => mockNavigation }))
jest.mock('../src/services/users', () => ({ getAccountEntryRoute: jest.fn() }))
jest.mock('../src/components/AuthScreen', () => ({ children }) => children)
jest.mock('../src/components/FormInput', () => {
  const { createElement } = require('react')
  const { useController } = require('react-hook-form')
  return ({ id, control, validation }) => {
    const { field } = useController({ name: id, control, rules: validation, defaultValue: '' })
    return createElement('Field', { id, onChangeText: field.onChange })
  }
})
jest.mock('native-base', () => ({
  Button: 'Button',
  Flex: 'Flex',
  Text: 'Text',
  useToast: () => mockToast
}))

let tree
const render = (Component) => act(() => {
  tree = renderer.create(<Component />)
})
const fill = (fields) => act(() => {
  Object.entries(fields).forEach(([id, value]) => {
    tree.root.findAllByType('Field').find((field) => field.props.id === id).props.onChangeText(value)
  })
})
const press = (label) => act(async () => {
  const button = tree.root.findAllByType('Button').find(({ props }) => props.children === label)
  await button.props.onPress()
})

beforeEach(() => jest.resetAllMocks())
afterEach(() => act(() => tree?.unmount()))

test('returning customer signs in and resumes the walking app', async () => {
  const user = { uid: 'returning' }
  mockAuth.signInWithEmailAndPassword.mockResolvedValue({ user })
  getAccountEntryRoute.mockResolvedValue('Main')
  render(Login)
  fill({ email: 'walker@example.com', password: 'test-password' })
  await press('Log in')
  expect(mockAuth.signInWithEmailAndPassword).toHaveBeenCalledWith('walker@example.com', 'test-password')
  expect(getAccountEntryRoute).toHaveBeenCalledWith(user)
  expect(mockNavigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Main' }] })
})

test('new customer signs up and enters Health setup without payment', async () => {
  const user = { uid: 'new' }
  mockAuth.createUserWithEmailAndPassword.mockResolvedValue({ user })
  getAccountEntryRoute.mockResolvedValue('AppleHealth')
  render(SignUp)
  fill({ name: '  Test Walker  ', email: 'new@example.com', password: 'test-password' })
  await press('Register')
  expect(mockAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith('new@example.com', 'test-password')
  expect(getAccountEntryRoute).toHaveBeenCalledWith(user, 'Test Walker')
  expect(mockNavigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'AppleHealth' }] })
})

test.each([' '.repeat(3), 'L'.repeat(101)])('signup rejects an invalid name before creating an account', async (name) => {
  render(SignUp)
  fill({ name, email: 'new@example.com', password: 'test-password' })
  await press('Register')
  expect(mockAuth.createUserWithEmailAndPassword).not.toHaveBeenCalled()
})

test('login returns to Welcome after finishing a pending deletion', async () => {
  mockAuth.signInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'pending' } })
  getAccountEntryRoute.mockResolvedValue('Welcome')
  render(Login)
  fill({ email: 'walker@example.com', password: 'test-password' })
  await press('Log in')
  expect(mockNavigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Welcome' }] })
})

test.each([
  ['auth/invalid-credential', 'The email or password is incorrect.'],
  ['auth/network-request-failed', 'Check your connection and try again.']
])('login gives an actionable error for %s', async (code, description) => {
  mockAuth.signInWithEmailAndPassword.mockRejectedValue({ code, message: '[Firebase SDK]' })
  render(Login)
  fill({ email: 'walker@example.com', password: 'test-password' })
  await press('Log in')
  expect(mockToast.show).toHaveBeenCalledWith({ status: 'error', description })
  expect(mockNavigation.reset).not.toHaveBeenCalled()
})

test('duplicate signup directs the customer to their existing account', async () => {
  mockAuth.createUserWithEmailAndPassword.mockRejectedValue({ code: 'auth/email-already-in-use' })
  render(SignUp)
  fill({ name: 'Test Walker', email: 'walker@example.com', password: 'test-password' })
  await press('Register')
  expect(mockToast.show).toHaveBeenCalledWith({
    status: 'error',
    description: 'This email already has an account. Log in or reset your password.'
  })
  expect(mockNavigation.reset).not.toHaveBeenCalled()
})

test.each([
  ['success', null, 'success', true],
  ['unknown account', 'auth/user-not-found', 'success', true],
  ['offline', 'auth/network-request-failed', 'error', false]
])('password reset handles %s', async (_, code, status, goesBack) => {
  if (code) mockAuth.sendPasswordResetEmail.mockRejectedValue({ code })
  else mockAuth.sendPasswordResetEmail.mockResolvedValue()
  render(Reset)
  fill({ email: 'walker@example.com' })
  await press('Send Reset Link')
  expect(mockAuth.sendPasswordResetEmail).toHaveBeenCalledWith('walker@example.com')
  expect(mockToast.show).toHaveBeenCalledWith(expect.objectContaining({ status }))
  expect(mockNavigation.goBack).toHaveBeenCalledTimes(goesBack ? 1 : 0)
})
