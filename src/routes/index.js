import { useEffect, useState } from 'react'
import Welcome from '../screens/Welcome'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import auth from '@react-native-firebase/auth'
import SplashScreen from 'react-native-splash-screen'
import SignUp from '../screens/SignUp'
import Login from '../screens/Login'
import Reset from '../screens/Reset'
import Main from '../routes/Main'
import AppleHealth from '../screens/AppleHealth'
import { getUserData } from '../services/database'
import { checkAppleHealth } from '../services/helpers'
import { navigationRef } from './RootNavigation'

const { Navigator, Screen } = createNativeStackNavigator()

export const Routes = () => {
  const [initScreen, setInitScreen] = useState(null)

  useEffect(() => {
    let authFlag = true
    auth().onAuthStateChanged(async (_user) => {
      if (!authFlag) return
      authFlag = false
      let flow = 'Welcome'
      const { name } = (await getUserData()) || {}
      const results = await checkAppleHealth()
      if (!!_user && !!name) {
        if (!!results) {
          flow = 'Main'
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
    <NavigationContainer ref={navigationRef}>
      <Navigator
        initialRouteName={initScreen}
        screenOptions={{ headerShown: false }}
      >
        <Screen name="Main" component={Main} />
        <Screen name="AppleHealth" component={AppleHealth} />
        <Screen name="Welcome" component={Welcome} />
        <Screen name="SignUp" component={SignUp} />
        <Screen name="Login" component={Login} />
        <Screen name="Reset" component={Reset} />
      </Navigator>
    </NavigationContainer>
  )
}
