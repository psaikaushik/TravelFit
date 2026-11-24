import { Notifications } from 'react-native-notifications'
import { getCurrentAccountId, getData } from '../src/services/database'
import { clearNotifications, listenForNotifications } from '../src/services/notifications'

const mockEvents = {
  registerNotificationReceivedForeground: jest.fn(),
  registerNotificationOpened: jest.fn()
}

jest.mock('react-native-notifications', () => ({
  Notifications: {
    events: () => mockEvents,
    ios: { cancelAllLocalNotifications: jest.fn() },
    removeAllDeliveredNotifications: jest.fn()
  }
}))
jest.mock('../src/services/database', () => ({
  getCurrentAccountId: jest.fn(),
  getData: jest.fn()
}))

const currentMilestone = { payload: { accountId: 'walker', category: 'BADGE' } }
const quietHoursStart = 22
const quietHoursEnd = 7
const prefs = { enabled: true, milestoneAlerts: true, quietHoursStart, quietHoursEnd }

const foreground = () => mockEvents.registerNotificationReceivedForeground.mock.calls[0][0]

beforeEach(() => {
  jest.resetAllMocks()
  jest.spyOn(Date.prototype, 'getHours').mockReturnValue(12)
  getCurrentAccountId.mockReturnValue('walker')
  getData.mockResolvedValue(JSON.stringify(prefs))
  mockEvents.registerNotificationReceivedForeground.mockReturnValue({ remove: jest.fn() })
  mockEvents.registerNotificationOpened.mockReturnValue({ remove: jest.fn() })
})

afterEach(() => jest.restoreAllMocks())

it('completes foreground presentation and opens, then removes both subscriptions', async () => {
  const unsubscribe = listenForNotifications()
  const complete = jest.fn()
  await foreground()(currentMilestone, complete)

  expect(getData).toHaveBeenCalledWith('notification_prefs', 'walker')
  expect(complete).toHaveBeenCalledTimes(1)
  expect(complete).toHaveBeenCalledWith({ alert: true, sound: true, badge: false })

  const completeOpen = jest.fn()
  mockEvents.registerNotificationOpened.mock.calls[0][0](currentMilestone, completeOpen)
  expect(completeOpen).toHaveBeenCalledTimes(1)

  unsubscribe()
  expect(mockEvents.registerNotificationReceivedForeground.mock.results[0].value.remove).toHaveBeenCalledTimes(1)
  expect(mockEvents.registerNotificationOpened.mock.results[0].value.remove).toHaveBeenCalledTimes(1)
})

it('completes without presentation when quiet hours or the alert preference suppress it', async () => {
  listenForNotifications()
  const complete = jest.fn()

  Date.prototype.getHours.mockReturnValue(23)
  await foreground()(currentMilestone, complete)

  Date.prototype.getHours.mockReturnValue(12)
  getData.mockResolvedValue(JSON.stringify({ ...prefs, milestoneAlerts: false }))
  await foreground()(currentMilestone, complete)

  expect(complete.mock.calls).toEqual([
    [{ alert: false, sound: false, badge: false }],
    [{ alert: false, sound: false, badge: false }]
  ])
})

it('does not present a queued notification after an account switch or teardown', async () => {
  const unsubscribe = listenForNotifications()
  const complete = jest.fn()
  let releasePrefs
  getData.mockImplementationOnce(() => new Promise((resolve) => { releasePrefs = resolve }))
  const firstDelivery = foreground()(currentMilestone, complete)
  getCurrentAccountId.mockReturnValue('other-walker')
  releasePrefs(JSON.stringify(prefs))
  await firstDelivery

  await foreground()(currentMilestone, complete)
  expect(getData).toHaveBeenCalledTimes(1)

  getCurrentAccountId.mockReturnValue('walker')
  getData.mockImplementationOnce(() => new Promise((resolve) => { releasePrefs = resolve }))
  const finalDelivery = foreground()(currentMilestone, complete)
  unsubscribe()
  releasePrefs(JSON.stringify(prefs))
  await finalDelivery

  expect(complete.mock.calls).toEqual(Array(3).fill([{ alert: false, sound: false, badge: false }]))
})

it('cancels queued local notifications before clearing delivered ones', () => {
  clearNotifications()
  const { cancelAllLocalNotifications } = Notifications.ios
  expect(cancelAllLocalNotifications).toHaveBeenCalledTimes(1)
  expect(Notifications.removeAllDeliveredNotifications).toHaveBeenCalledTimes(1)
  expect(cancelAllLocalNotifications.mock.invocationCallOrder[0])
    .toBeLessThan(Notifications.removeAllDeliveredNotifications.mock.invocationCallOrder[0])
})
