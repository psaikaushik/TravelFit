import React, { useEffect } from 'react'
import { useIsFocused } from '@react-navigation/native'
import { StatusBar } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Map from '../screens/Map'
import Profile from '../screens/Profile'
import Progress from '../screens/Progress'
import { Flex, View } from 'native-base'

const Tab = createBottomTabNavigator()

const Main = () => {
  const isFocused = useIsFocused()

  useEffect(() => {
    if (isFocused) {
      StatusBar.setBarStyle('dark-content', true)
    }
  }, [isFocused])

  return (
    <Tab.Navigator initialRouteName={'Profile'}>
      <Tab.Screen
        name="Map"
        component={Map}
        options={{
          title: 'Map',
          tabBarStyle: { display: 'none' },
          headerBackground: () => <Flex flex="1" bg="offWhite" />
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
