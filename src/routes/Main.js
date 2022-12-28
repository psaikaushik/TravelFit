import { useEffect, useState } from 'react'
import Welcome from '../screens/Welcome'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import auth from '@react-native-firebase/auth'
import SplashScreen from 'react-native-splash-screen'
import SignUp from '../screens/SignUp'
import Login from '../screens/Login'
import Reset from '../screens/Reset'
import Map from '../screens/Map'
import AppleHealth from '../screens/AppleHealth'
import { getUserData, getUserSettings } from '../services/database'

const { Navigator, Screen } = createNativeStackNavigator()

export function StackRoutes() {
  const [initScreen, setInitScreen] = useState(null)

  useEffect(() => {
    auth().onAuthStateChanged(async (_user) => {
      const { name } = (await getUserData()) || {}
      const { healthConnected } = (await getUserSettings()) || {}
      let flow = 'Welcome'
      if (!!_user && !!name) {
        if (!!healthConnected) {
          flow = 'Map'
        } else {
          flow = 'AppleHealth'
        }
      }
      setInitScreen(flow)
      SplashScreen.hide()
    })
  }, [])

  if (!initScreen) return <></>

  return (
    <>
      <Navigator
        initialRouteName={initScreen}
        screenOptions={{ headerShown: false }}
      >
        <Screen name="Map" component={Map} />
        <Screen name="AppleHealth" component={AppleHealth} />
        <Screen name="Welcome" component={Welcome} />
        <Screen name="SignUp" component={SignUp} />
        <Screen name="Login" component={Login} />
        <Screen name="Reset" component={Reset} />
      </Navigator>
    </>
  )
}
