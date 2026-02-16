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
import CuratedRoutes from '../screens/CuratedRoutes'
import ShareProgress from '../screens/ShareProgress'
import Onboarding from '../screens/Onboarding'
import NotificationSettings from '../screens/NotificationSettings'
import Challenges from '../screens/Challenges'
import Races from '../screens/Races'
import RaceDetail from '../screens/RaceDetail'
import Leaderboards from '../screens/Leaderboards'
import ShareMoment from '../screens/ShareMoment'
import GroupDetail from '../screens/GroupDetail'

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
        <Screen name="CuratedRoutes" component={CuratedRoutes} />
        <Screen name="ShareProgress" component={ShareProgress} />
        <Screen name="Onboarding" component={Onboarding} />
        <Screen name="NotificationSettings" component={NotificationSettings} />
        <Screen name="Challenges" component={Challenges} />
        <Screen name="Races" component={Races} />
        <Screen name="RaceDetail" component={RaceDetail} />
        <Screen name="Leaderboards" component={Leaderboards} />
        <Screen name="ShareMoment" component={ShareMoment} />
        <Screen name="GroupDetail" component={GroupDetail} />
      </Navigator>
      <PlaceRoutes />
    </NavigationContainer>
  )
}
