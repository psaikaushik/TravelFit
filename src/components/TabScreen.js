import React, { useRef, useEffect } from 'react'
import { Animated, StyleSheet } from 'react-native'
import { Flex, Pressable, Text } from 'native-base'
import { useNavigation } from '@react-navigation/native'
import { hasNotch } from 'react-native-device-info'
import haptics from '../utils/haptics'
import RouteSVG from '../assets/icons/route.svg'
import ProgressSVG from '../assets/icons/progress.svg'
import SocialSVG from '../assets/icons/social.svg'
import StarSVG from '../assets/icons/star.svg'
import ProfileSVG from '../assets/icons/profile.svg'
import RouteActiveSVG from '../assets/icons/routeActive.svg'
import ProgressActiveSVG from '../assets/icons/progressActive.svg'
import SocialActiveSVG from '../assets/icons/socialActive.svg'
import StarActiveSVG from '../assets/icons/starActive.svg'
import ProfileActiveSVG from '../assets/icons/profileActive.svg'

const TAB_LABELS = ['Map', 'Progress', 'Social', 'Stars', 'Profile']

const TabItem = ({ isActive, onPress, activeIcon, inactiveIcon, label }) => {
  const scale = useRef(new Animated.Value(1)).current
  const dotOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(dotOpacity, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: true
    }).start()
  }, [isActive, dotOpacity])

  const handlePress = () => {
    haptics.selection()
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true
      })
    ]).start()
    onPress()
  }

  return (
    <Pressable flex="1" onPress={handlePress} accessibilityLabel={label} accessibilityRole="tab">
      <Animated.View style={[styles.tabItem, { transform: [{ scale }] }]}>
        <Flex align="center" justify="center" flex="1">
          {isActive ? activeIcon : inactiveIcon}
          <Animated.View style={[styles.activeDot, { opacity: dotOpacity }]} />
        </Flex>
      </Animated.View>
    </Pressable>
  )
}

const TabScreen = ({ children }) => {
  const { navigate, getState } = useNavigation()
  const isIphoneX = hasNotch()

  let index = 0
  try {
    index = getState()?.index || 0
  } catch (e) {
    // Navigation state not ready yet
  }

  const tabs = [
    { name: 'Map', active: <RouteActiveSVG width={22} />, inactive: <RouteSVG width={22} /> },
    { name: 'Progress', active: <ProgressActiveSVG width={23} />, inactive: <ProgressSVG width={23} /> },
    { name: 'Social', active: <SocialActiveSVG width={24} />, inactive: <SocialSVG width={24} /> },
    { name: 'Achievements', active: <StarActiveSVG width={26} />, inactive: <StarSVG width={26} /> },
    { name: 'Profile', active: <ProfileActiveSVG width={22} />, inactive: <ProfileSVG width={22} /> }
  ]

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
        style={styles.shadow}
      >
        {tabs.map((tab, i) => (
          <TabItem
            key={tab.name}
            isActive={index === i}
            onPress={() => navigate(tab.name)}
            activeIcon={tab.active}
            inactiveIcon={tab.inactive}
            label={TAB_LABELS[i]}
          />
        ))}
      </Flex>
    </>
  )
}

const styles = StyleSheet.create({
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#C4EB64',
    marginTop: 4
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8
  }
})

export default TabScreen
