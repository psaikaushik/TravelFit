import AsyncStorage from '@react-native-async-storage/async-storage'

const getData = async (type) => {
  try {
    return await AsyncStorage.getItem(type)
  } catch (e) {
    return null
  }
}

const storeData = async (type, value) => {
  try {
    await AsyncStorage.setItem(type, value)
  } catch (e) {
    console.log('storeData', e)
  }
}

const removeData = async (type) => {
  try {
    await AsyncStorage.removeItem(type, value)
  } catch (e) {
    console.log('removeData', e)
  }
}

const getListData = async (type) => {
  const data = await getData(type)
  return data && data !== 'null' && typeof data !== 'undefined'
    ? JSON.parse(data)
    : {}
}

const setListData = async (type, value) => {
  await storeData(type, JSON.stringify(value))
}

const getUserData = async () => {
  return getListData('user_data')
}

const setUserData = async (value) => {
  return setListData('user_data', value)
}

export {
  getData,
  storeData,
  removeData,
  getListData,
  setListData,
  getUserData,
  setUserData
}
