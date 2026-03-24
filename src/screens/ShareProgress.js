import React, { useRef } from 'react'
import { SafeAreaView, StatusBar, Share, View } from 'react-native'
import {
  Box,
  Text,
  VStack,
  HStack,
  Flex,
  Pressable,
  Button
} from 'native-base'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { getUserSettings } from '../services/database'
import { calcProgress, prettifyNum, stepsToDistance } from '../services/helpers'
import BackSVG from '../assets/icons/back.svg'
import logger from '../utils/logger'

const ShareProgress = () => {
  const { goBack } = useNavigation()
  const cardRef = useRef(null)
  const { data: settings } = useQuery(['settings'], getUserSettings)

  const {
    starting,
    destination,
    steps = 0,
    distance = 1,
    badges = [],
    cities = [],
    route = []
  } = settings || {}

  const progress = calcProgress(steps, distance)
  const distanceWalked = stepsToDistance(steps)
  const landmarksDiscovered = badges.filter((b) => b?.progress > 0).length
  const citiesVisited = cities.length

  const handleShare = async () => {
    const message =
      `TravelFit Progress Update!\n\n` +
      `Route: ${starting?.title || 'Start'} \u2192 ${destination?.title || 'Destination'}\n` +
      `Progress: ${Math.min(progress, 100).toFixed(1)}%\n` +
      `Steps Walked: ${prettifyNum(steps)}\n` +
      `Distance Walked: ${distanceWalked} km\n` +
      `Landmarks Discovered: ${landmarksDiscovered}\n` +
      `Cities Visited: ${citiesVisited}\n\n` +
      `Track your walking journey with TravelFit!`

    try {
      await Share.share({ message })
    } catch (error) {
      logger.log('Share error:', error)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F3F6' }}>
      <StatusBar barStyle="dark-content" />

      <Flex direction="row" align="center" px="16px" py="12px">
        <Pressable onPress={goBack} p="4px" accessibilityLabel="Go back" accessibilityRole="button">
          <BackSVG />
        </Pressable>
        <Text fontSize="20px" fontWeight="700" ml="12px" accessibilityRole="header">
          Share Progress
        </Text>
      </Flex>

      <Flex flex="1" px="20px" alignItems="center" justifyContent="center">
        <View ref={cardRef}>
          <Box
            bg="primary.400"
            borderRadius="20px"
            p="24px"
            w="100%"
            shadow="6"
          >
            <VStack space="4" alignItems="center">
              <Text fontSize="24px" fontWeight="900" color="white">
                TravelFit
              </Text>

              <Text fontSize="14px" fontWeight="600" color="white" textAlign="center" numberOfLines={2}>
                {starting?.title || 'Start'} {'\u2192'} {destination?.title || 'Destination'}
              </Text>

              <Box
                bg="rgba(255,255,255,0.2)"
                borderRadius="16px"
                px="20px"
                py="12px"
                w="100%"
                alignItems="center"
              >
                <Text fontSize="40px" fontWeight="900" color="white">
                  {Math.min(progress, 100).toFixed(1)}%
                </Text>
                <Text fontSize="13px" fontWeight="500" color="white" opacity={0.85}>
                  Journey Progress
                </Text>
              </Box>

              <HStack space="4" w="100%" justifyContent="space-between">
                <VStack flex="1" alignItems="center" bg="rgba(255,255,255,0.15)" borderRadius="12px" py="12px">
                  <Text fontSize="20px" fontWeight="800" color="white">
                    {prettifyNum(steps)}
                  </Text>
                  <Text fontSize="11px" fontWeight="500" color="white" opacity={0.85}>
                    Steps Walked
                  </Text>
                </VStack>
                <VStack flex="1" alignItems="center" bg="rgba(255,255,255,0.15)" borderRadius="12px" py="12px">
                  <Text fontSize="20px" fontWeight="800" color="white">
                    {distanceWalked}
                  </Text>
                  <Text fontSize="11px" fontWeight="500" color="white" opacity={0.85}>
                    KM Walked
                  </Text>
                </VStack>
              </HStack>

              <HStack space="4" w="100%" justifyContent="space-between">
                <VStack flex="1" alignItems="center" bg="rgba(255,255,255,0.15)" borderRadius="12px" py="12px">
                  <Text fontSize="20px" fontWeight="800" color="white">
                    {landmarksDiscovered}
                  </Text>
                  <Text fontSize="11px" fontWeight="500" color="white" opacity={0.85}>
                    Landmarks
                  </Text>
                </VStack>
                <VStack flex="1" alignItems="center" bg="rgba(255,255,255,0.15)" borderRadius="12px" py="12px">
                  <Text fontSize="20px" fontWeight="800" color="white">
                    {citiesVisited}
                  </Text>
                  <Text fontSize="11px" fontWeight="500" color="white" opacity={0.85}>
                    Cities Visited
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </Box>
        </View>

        <Button
          mt="24px"
          w="100%"
          bg="primary.400"
          borderRadius="16px"
          py="16px"
          _text={{ fontSize: '16px', fontWeight: '700', color: 'white' }}
          _pressed={{ bg: 'primary.500' }}
          onPress={handleShare}
          accessibilityLabel="Share your progress"
          accessibilityRole="button"
        >
          Share Progress
        </Button>
      </Flex>
    </SafeAreaView>
  )
}

export default ShareProgress
