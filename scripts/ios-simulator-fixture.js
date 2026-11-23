import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import firebase from '@react-native-firebase/app'
import auth from '@react-native-firebase/auth'
import database from '@react-native-firebase/database'
import functions from '@react-native-firebase/functions'
import HealthKit from 'react-native-health'

// CI imports this file only while bundling the unsigned simulator test app.
const { projectId, apiKey } = firebase.app().options
if (
  Platform.OS !== 'ios' ||
  !DeviceInfo.isEmulatorSync() ||
  projectId !== 'demo-travelfit-audit' ||
  apiKey !== `AIza${'0'.repeat(35)}`
) {
  throw new Error('The TravelFit simulator fixture requires an isolated demo app.')
}

auth().useEmulator('http://127.0.0.1:19099')
database().useEmulator('127.0.0.1', 19000)
functions().useEmulator('127.0.0.1', 19501)

HealthKit.initHealthKit = (_options, callback) => callback(null, true)
HealthKit.getDailyStepCountSamples = (_options, callback) => {
  const now = new Date().toISOString()
  callback(null, [{ startDate: now, endDate: now, value: 20000 }])
}
