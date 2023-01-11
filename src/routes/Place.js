import { NavigationContainer } from '@react-navigation/native'
import { createBottomSheetNavigator } from '@th3rdwave/react-navigation-bottom-sheet'
import { hasNotch } from 'react-native-device-info'
import * as React from 'react'
import { Dimensions } from 'react-native'
import { navigationRef } from './PlaceNavigation'
import PlaceModal from '../screens/PlaceModal'

const BottomSheet = createBottomSheetNavigator()

const Closed = () => null

export const PlaceRoutes = () => {
  const isIphoneX = hasNotch()
  const { height } = Dimensions.get('window')
  const rewardModalHeight = (420 / height) * 100

  return (
    <NavigationContainer independent ref={navigationRef}>
      <BottomSheet.Navigator
        screenOptions={{
          snapPoints: [`${rewardModalHeight}%`]
        }}
      >
        <BottomSheet.Screen name="Closed" component={Closed} />
        <BottomSheet.Screen
          name="PlaceModal"
          component={PlaceModal}
          options={{
            detached: true,
            bottomInset: isIphoneX ? 34 : 20,
            backgroundStyle: {
              backgroundColor: '#FFFFFF'
            },
            handleIndicatorStyle: {
              backgroundColor: '#D9D9D9'
            },
            style: {
              marginHorizontal: 10
            }
          }}
        />
      </BottomSheet.Navigator>
    </NavigationContainer>
  )
}
