import React from 'react'
import { Flex, Pressable } from 'native-base'
import { useNavigation } from '@react-navigation/native'
import { hasNotch } from 'react-native-device-info'
import RouteSVG from '../assets/icons/route.svg'
import ProgressSVG from '../assets/icons/progress.svg'
import StarSVG from '../assets/icons/star.svg'
import ProfileSVG from '../assets/icons/profile.svg'
import RouteActiveSVG from '../assets/icons/routeActive.svg'
import ProgressActiveSVG from '../assets/icons/progressActive.svg'
import StarActiveSVG from '../assets/icons/starActive.svg'
import ProfileActiveSVG from '../assets/icons/profileActive.svg'

const TabScreen = ({ children }) => {
  const { navigate, getState } = useNavigation()
  const isIphoneX = hasNotch()
  const { index } = getState()

  return (
    <>
      {children}
      <Flex
        bg="white"
        h="60px"
        left="20px"
        right="20px"
        direction="row"
        justify="space-between"
        borderWidth="1px"
        borderColor="border"
        borderRadius="16px"
        position="absolute"
        bottom={isIphoneX ? '34px' : '20px'}
      >
        <Pressable flex="1" accessibilityRole="tab" accessibilityLabel="Map" onPress={() => navigate('Map')} testID="tab-map">
          <Flex flex="1" align="center" justify="center">
            {index === 0 ? (
              <RouteActiveSVG width={22} />
            ) : (
              <RouteSVG width={22} />
            )}
          </Flex>
        </Pressable>
        <Pressable flex="1" accessibilityRole="tab" accessibilityLabel="Progress" onPress={() => navigate('Progress')}>
          <Flex flex="1" align="center" justify="center">
            {index === 1 ? (
              <ProgressActiveSVG width={23} />
            ) : (
              <ProgressSVG width={23} />
            )}
          </Flex>
        </Pressable>
        <Pressable flex="1" accessibilityRole="tab" accessibilityLabel="Achievements" onPress={() => navigate('Achievements')}>
          <Flex flex="1" align="center" justify="center">
            {index === 2 ? (
              <StarActiveSVG width={26} />
            ) : (
              <StarSVG width={26} />
            )}
          </Flex>
        </Pressable>
        <Pressable flex="1" accessibilityRole="tab" accessibilityLabel="Profile" onPress={() => navigate('Profile')} testID="tab-profile">
          <Flex flex="1" align="center" justify="center">
            {index === 3 ? (
              <ProfileActiveSVG width={22} />
            ) : (
              <ProfileSVG width={22} />
            )}
          </Flex>
        </Pressable>
      </Flex>
    </>
  )
}

export default TabScreen
