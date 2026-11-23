import React, { useEffect, useState } from 'react'
import { Button, Center, Spinner, Text, VStack } from 'native-base'
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
import Trip from '../screens/Trip'
import { PlaceRoutes } from './Place'
import { checkFlow } from '../services/helpers'
import { getUserData } from '../services/database'
import { cacheAccountProfile } from '../services/users'
import { navigationRef } from './RootNavigation'
import PrivacyPolicy from '../screens/PrivacyPolicy'
import TripHistory from '../screens/TripHistory'
import WeeklyStats from '../screens/WeeklyStats'
import CuratedRoutes from '../screens/CuratedRoutes'
import Onboarding from '../screens/Onboarding'
import NotificationSettings from '../screens/NotificationSettings'

const { Navigator, Screen } = createNativeStackNavigator()

export const Routes = () => {
  const [initScreen, setInitScreen] = useState(null)
  const [bootFailed, setBootFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let settled = false
    let started = false
    const finish = (flow) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      if (flow) setInitScreen(flow)
      else setBootFailed(true)
      SplashScreen.hide()
    }
    const timeout = setTimeout(() => finish(), 10000)
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      if (started || settled) return
      started = true
      try {
        if (user && !(await getUserData()).name) {
          await cacheAccountProfile(user)
        }
        if (!settled) finish(await checkFlow(user))
      } catch {
        finish()
      }
    })

    return () => {
      settled = true
      clearTimeout(timeout)
      unsubscribe()
    }
  }, [attempt])

  if (!initScreen) {
    return (
      <Center flex={1} backgroundColor="#F3F3F6" px="6">
        {bootFailed ? (
          <VStack space="4" alignItems="center">
            <Text textAlign="center">TravelFit could not start. Check your connection and try again.</Text>
            <Button onPress={() => {
              setBootFailed(false)
              setAttempt((value) => value + 1)
            }}>
              Try again
            </Button>
          </VStack>
        ) : <Spinner accessibilityLabel="Starting TravelFit" />}
      </Center>
    )
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Navigator
        initialRouteName={initScreen}
        screenOptions={{ headerShown: false }}
      >
        <Screen name="Main" component={Main} />
        <Screen name="AppleHealth" component={AppleHealth} />
        <Screen name="Trip" component={Trip} />
        <Screen name="Welcome" component={Welcome} />
        <Screen name="SignUp" component={SignUp} />
        <Screen name="Login" component={Login} />
        <Screen name="Reset" component={Reset} />
        <Screen name="PrivacyPolicy" component={PrivacyPolicy} />
        <Screen name="TripHistory" component={TripHistory} />
        <Screen name="WeeklyStats" component={WeeklyStats} />
        <Screen name="CuratedRoutes" component={CuratedRoutes} />
        <Screen name="Onboarding" component={Onboarding} />
        <Screen name="NotificationSettings" component={NotificationSettings} />
      </Navigator>
      <PlaceRoutes />
    </NavigationContainer>
  )
}
