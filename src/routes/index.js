import { useEffect, useState } from 'react'
import { View } from 'native-base'
import Welcome from '../screens/Welcome'
import VideoIntro from '../screens/VideoIntro'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import auth from '@react-native-firebase/auth'
import SplashScreen from 'react-native-splash-screen'
import SignUp from '../screens/SignUp'
import Login from '../screens/Login'
import Reset from '../screens/Reset'
import Main from '../routes/Main'
import AppleHealth from '../screens/AppleHealth'
import Trip from '../screens/Trip'
import { PlaceRoutes } from './Place'
import { checkFlow } from '../services/helpers'
import { navigationRef } from './RootNavigation'
import Subscription from '../screens/Subscription'
import CreditCard from '../screens/CreditCard'
import SubscriptionSelection from '../screens/SubscriptionSelection'
import PrivacyPolicy from '../screens/PrivacyPolicy'
import TripHistory from '../screens/TripHistory'
import WeeklyStats from '../screens/WeeklyStats'

const { Navigator, Screen } = createNativeStackNavigator()

export const Routes = () => {
  const [initScreen, setInitScreen] = useState(null)
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    let authFlag = true
    auth().onAuthStateChanged((_user) => {
      if (!authFlag) return
      authFlag = false
      setUser(_user)
    })
  }, [])

  useEffect(() => {
    if (typeof user !== 'undefined') {
      checkFlow(user).then(async (flow) => {
        setInitScreen(flow)
        SplashScreen.hide()
      })
    }
  }, [user])

  if (!initScreen)
    return <View style={{ flex: 1, backgroundColor: '#F3F3F6' }} />

  return (
    <NavigationContainer ref={navigationRef}>
      <Navigator
        initialRouteName={initScreen}
        screenOptions={{ headerShown: false }}
      >
        <Screen name="Main" component={Main} />
        <Screen name="AppleHealth" component={AppleHealth} />
        <Screen name="Trip" component={Trip} />
        <Screen name="VideoIntro" component={VideoIntro} />
        <Screen name="Welcome" component={Welcome} />
        <Screen name="SignUp" component={SignUp} />
        <Screen name="Login" component={Login} />
        <Screen name="Reset" component={Reset} />
        <Screen name="Subscription" component={Subscription} />
        <Screen name="CreditCard" component={CreditCard} />
        <Screen name="SubscriptionSelection" component={SubscriptionSelection} />
        <Screen name="PrivacyPolicy" component={PrivacyPolicy} />
        <Screen name="TripHistory" component={TripHistory} />
        <Screen name="WeeklyStats" component={WeeklyStats} />
      </Navigator>
      <PlaceRoutes />
    </NavigationContainer>
  )
}
