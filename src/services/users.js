import database from '@react-native-firebase/database'
import auth from '@react-native-firebase/auth'

export const getProfile = async () =>
  database()
    .ref(`users/${auth().currentUser.uid}`)
    .once('value', (snapshot) => {
      return snapshot.val()
    })
export const setProfile = async (data) =>
  database().ref(`users/${auth().currentUser.uid}`).set(data)
export const updateProfile = async (data) =>
  database().ref(`users/${auth().currentUser.uid}`).update(data)

export default { getProfile, setProfile, updateProfile }
