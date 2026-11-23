import AsyncStorage from '@react-native-async-storage/async-storage'
import auth from '@react-native-firebase/auth'

const clearedAccounts = new Set()

export const getCurrentAccountId = () => auth().currentUser?.uid

const accountPrefix = (uid) => `travelfit:account:${encodeURIComponent(uid)}:`

const canUseAccount = (uid) =>
  !!uid && uid === getCurrentAccountId() && !clearedAccounts.has(uid)

const getData = async (type, accountId) => {
  const uid = typeof accountId === 'string' ? accountId : getCurrentAccountId()
  if (!canUseAccount(uid)) return null

  try {
    const value = await AsyncStorage.getItem(accountPrefix(uid) + type)
    return canUseAccount(uid) ? value : null
  } catch (e) {
    return null
  }
}

const storeData = async (type, value, uid = getCurrentAccountId()) => {
  if (!canUseAccount(uid)) return
  await AsyncStorage.setItem(accountPrefix(uid) + type, value)
}

const removeData = async (type, uid = getCurrentAccountId()) => {
  if (!canUseAccount(uid)) return
  await AsyncStorage.removeItem(accountPrefix(uid) + type)
}

const getListData = async (type, uid) => {
  try {
    return JSON.parse(await getData(type, uid)) || {}
  } catch (e) {
    return {}
  }
}

const setListData = async (type, value, uid) => {
  await storeData(type, JSON.stringify(value), uid)
}

const getUserData = async (uid) => {
  return getListData('user_data', uid)
}

const setUserData = async (value, uid) => {
  return setListData('user_data', value, uid)
}

const getUserSettings = async (uid) => {
  return getListData('user_settings', uid)
}

const setUserSettings = async (value, uid) => {
  return setListData('user_settings', value, uid)
}

export const clearLocalAccountData = async (uid) => {
  if (!uid) return

  clearedAccounts.add(uid)
  const prefix = accountPrefix(uid)
  const keys = (await AsyncStorage.getAllKeys()).filter((key) =>
    key.startsWith(prefix)
  )
  if (keys.length) await AsyncStorage.multiRemove(keys)
}

export {
  getData,
  storeData,
  removeData,
  getListData,
  setListData,
  getUserData,
  setUserData,
  getUserSettings,
  setUserSettings
}
