import { useEffect, useState } from 'react'
import Welcome from '../screens/Welcome'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import SignUp from '../screens/SignUp'
import Login from '../screens/Login'
import Reset from '../screens/Reset'
import Main from '../screens/Main'
import { firebase } from '@react-native-firebase/auth'
import SplashScreen from 'react-native-splash-screen'

const { Navigator, Screen } = createNativeStackNavigator()

export function StackRoutes() {
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    firebase.auth().onAuthStateChanged((_user) => {
      setUser(_user)
      setLoadingAuth(false)
      SplashScreen.hide()
    })
  }, [])

  if (loadingAuth) return <></>

  return (
    <>
      <Navigator
        initialRouteName={!!user ? 'Main' : 'Welcome'}
        screenOptions={{ headerShown: false }}
      >
        <Screen name="Welcome" component={Welcome} />
        <Screen name="SignUp" component={SignUp} />
        <Screen name="Login" component={Login} />
        <Screen name="Reset" component={Reset} />
        <Screen name="Main" component={Main} />
      </Navigator>
    </>
  )
}
