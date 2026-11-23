import React, { useEffect } from 'react'
import { useIsFocused } from '@react-navigation/native'
import { StatusBar } from 'react-native'
import { Flex } from 'native-base'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Map from '../screens/Map'
import Profile from '../screens/Profile'
import Progress from '../screens/Progress'
import Achievements from '../screens/Achievements'

const Tab = createBottomTabNavigator()

const Main = () => {
  const isFocused = useIsFocused()

  useEffect(() => {
    if (isFocused) {
      StatusBar.setBarStyle('dark-content', true)
    }
  }, [isFocused])

  return (
    <Tab.Navigator initialRouteName={'Map'}>
      <Tab.Screen
        name="Map"
        component={Map}
        options={{
          title: 'Map',
          tabBarStyle: { display: 'none' },
          header: () => <></>
        }}
      />
      <Tab.Screen
        name="Progress"
        component={Progress}
        options={{
          title: 'Progress',
          tabBarStyle: { display: 'none' },
          headerBackground: () => <Flex flex="1" bg="secondary.400" />
        }}
      />
      <Tab.Screen
        name="Achievements"
        component={Achievements}
        options={{
          title: 'Achievements',
          tabBarStyle: { display: 'none' },
          headerBackground: () => <Flex flex="1" bg="secondary.400" />
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          title: 'Profile',
          tabBarStyle: { display: 'none' },
          headerBackground: () => <Flex flex="1" bg="offWhite" />
        }}
      />
    </Tab.Navigator>
  )
}

export default Main
