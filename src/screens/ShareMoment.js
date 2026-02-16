import React, { useState, useEffect } from 'react'
import { SafeAreaView, StatusBar, ScrollView, Share } from 'react-native'
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
import {
  getMilestoneShareData,
  shareCurrentProgress,
  shareRouteCompletion,
  shareStreak,
  shareLandmarkDiscovery,
  SHARE_CARD_TYPES
} from '../services/shareMoments'
import { getStreakData } from '../services/streak'
import { calcProgress, prettifyNum, stepsToDistance } from '../services/helpers'
import BackSVG from '../assets/icons/back.svg'

const ShareMoment = () => {
  const { goBack } = useNavigation()
  const [selectedCard, setSelectedCard] = useState(SHARE_CARD_TYPES.PROGRESS)
  const [shareData, setShareData] = useState(null)
  const [streakData, setStreakData] = useState(null)

  const { data: settings } = useQuery(['settings'], getUserSettings)

  useEffect(() => {
    getMilestoneShareData().then(setShareData)
    getStreakData().then(setStreakData)
  }, [])

  if (!shareData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F6FA' }}>
        <StatusBar barStyle="dark-content" />
        <Flex flex="1" align="center" justify="center">
          <Text color="primary.100">Loading...</Text>
        </Flex>
      </SafeAreaView>
    )
  }

  const handleShare = () => {
    switch (selectedCard) {
      case SHARE_CARD_TYPES.COMPLETION:
        shareRouteCompletion()
        break
      case SHARE_CARD_TYPES.STREAK:
        shareStreak(
          streakData?.currentStreak || 0,
          streakData?.longestStreak || 0
        )
        break
      default:
        shareCurrentProgress()
        break
    }
  }

  const renderProgressCard = () => (
    <Box bg="primary.400" borderRadius="24px" p="24px" mx="20px" shadow="6">
      <VStack space="4" alignItems="center">
        <Text fontSize="12px" fontWeight="700" color="secondary.400" letterSpacing="2px">
          TRAVELFIT JOURNEY
        </Text>

        <Text
          fontSize="16px"
          fontWeight="700"
          color="white"
          textAlign="center"
          numberOfLines={2}
        >
          {shareData.starting} → {shareData.destination}
        </Text>

        {/* Big Progress Circle */}
        <Box
          w="140px"
          h="140px"
          borderRadius="70px"
          borderWidth="8px"
          borderColor="secondary.400"
          alignItems="center"
          justifyContent="center"
          bg="rgba(255,255,255,0.08)"
        >
          <Text fontSize="36px" fontWeight="900" color="white">
            {parseFloat(shareData.progress).toFixed(0)}%
          </Text>
          <Text fontSize="11px" fontWeight="600" color="secondary.100">
            Complete
          </Text>
        </Box>

        {/* Stats Grid */}
        <HStack space="3" w="100%">
          <VStack
            flex="1"
            bg="rgba(255,255,255,0.12)"
            borderRadius="14px"
            py="12px"
            alignItems="center"
          >
            <Text fontSize="22px" fontWeight="800" color="white">
              {shareData.stepsFormatted}
            </Text>
            <Text fontSize="10px" fontWeight="600" color="secondary.100">
              Steps
            </Text>
          </VStack>
          <VStack
            flex="1"
            bg="rgba(255,255,255,0.12)"
            borderRadius="14px"
            py="12px"
            alignItems="center"
          >
            <Text fontSize="22px" fontWeight="800" color="white">
              {shareData.distanceWalked}
            </Text>
            <Text fontSize="10px" fontWeight="600" color="secondary.100">
              KM
            </Text>
          </VStack>
        </HStack>

        <HStack space="3" w="100%">
          <VStack
            flex="1"
            bg="rgba(255,255,255,0.12)"
            borderRadius="14px"
            py="12px"
            alignItems="center"
          >
            <Text fontSize="22px" fontWeight="800" color="white">
              {shareData.landmarksDiscovered}
            </Text>
            <Text fontSize="10px" fontWeight="600" color="secondary.100">
              Landmarks
            </Text>
          </VStack>
          <VStack
            flex="1"
            bg="rgba(255,255,255,0.12)"
            borderRadius="14px"
            py="12px"
            alignItems="center"
          >
            <Text fontSize="22px" fontWeight="800" color="white">
              {shareData.citiesVisited}
            </Text>
            <Text fontSize="10px" fontWeight="600" color="secondary.100">
              Cities
            </Text>
          </VStack>
        </HStack>

        {/* Cities List */}
        {shareData.cityNames.length > 0 && (
          <HStack flexWrap="wrap" justifyContent="center" space="1">
            {shareData.cityNames.slice(0, 5).map((city, idx) => (
              <Box
                key={idx}
                bg="rgba(255,255,255,0.15)"
                borderRadius="8px"
                px="8px"
                py="3px"
                mb="4px"
              >
                <Text fontSize="10px" fontWeight="600" color="secondary.200">
                  {city}
                </Text>
              </Box>
            ))}
          </HStack>
        )}

        <Text fontSize="10px" color="rgba(255,255,255,0.4)" mt="4px">
          {shareData.daysOnRoute} days walking · TravelFit
        </Text>
      </VStack>
    </Box>
  )

  const renderCompletionCard = () => (
    <Box borderRadius="24px" p="24px" mx="20px" shadow="6" overflow="hidden" bg="secondary.400">
      <VStack space="4" alignItems="center">
        <Text fontSize="40px">
          {'\u{1F3C6}'}
        </Text>
        <Text fontSize="12px" fontWeight="700" color="primary.400" letterSpacing="2px">
          JOURNEY COMPLETE
        </Text>
        <Text
          fontSize="18px"
          fontWeight="800"
          color="primary.400"
          textAlign="center"
        >
          {shareData.starting} → {shareData.destination}
        </Text>

        <HStack space="4" w="100%">
          <VStack flex="1" bg="rgba(0,0,0,0.08)" borderRadius="14px" py="14px" alignItems="center">
            <Text fontSize="24px" fontWeight="900" color="primary.400">
              {shareData.stepsFormatted}
            </Text>
            <Text fontSize="10px" fontWeight="600" color="primary.200">
              Total Steps
            </Text>
          </VStack>
          <VStack flex="1" bg="rgba(0,0,0,0.08)" borderRadius="14px" py="14px" alignItems="center">
            <Text fontSize="24px" fontWeight="900" color="primary.400">
              {shareData.daysOnRoute}
            </Text>
            <Text fontSize="10px" fontWeight="600" color="primary.200">
              Days
            </Text>
          </VStack>
        </HStack>

        <HStack space="4" w="100%">
          <VStack flex="1" bg="rgba(0,0,0,0.08)" borderRadius="14px" py="14px" alignItems="center">
            <Text fontSize="24px" fontWeight="900" color="primary.400">
              {shareData.landmarksDiscovered}
            </Text>
            <Text fontSize="10px" fontWeight="600" color="primary.200">
              Landmarks
            </Text>
          </VStack>
          <VStack flex="1" bg="rgba(0,0,0,0.08)" borderRadius="14px" py="14px" alignItems="center">
            <Text fontSize="24px" fontWeight="900" color="primary.400">
              {shareData.citiesVisited}
            </Text>
            <Text fontSize="10px" fontWeight="600" color="primary.200">
              Cities
            </Text>
          </VStack>
        </HStack>

        <Text fontSize="14px" fontWeight="700" color="primary.300" mt="4px">
          Can you beat my time? Race me on TravelFit!
        </Text>
      </VStack>
    </Box>
  )

  const renderStreakCard = () => (
    <Box bg="accent.coral" borderRadius="24px" p="24px" mx="20px" shadow="6">
      <VStack space="4" alignItems="center">
        <Text fontSize="12px" fontWeight="700" color="white" letterSpacing="2px">
          WALKING STREAK
        </Text>

        <Box
          w="120px"
          h="120px"
          borderRadius="60px"
          borderWidth="6px"
          borderColor="rgba(255,255,255,0.3)"
          alignItems="center"
          justifyContent="center"
          bg="rgba(255,255,255,0.1)"
        >
          <Text fontSize="42px" fontWeight="900" color="white">
            {streakData?.currentStreak || 0}
          </Text>
          <Text fontSize="11px" fontWeight="600" color="rgba(255,255,255,0.8)">
            Days
          </Text>
        </Box>

        <HStack space="4" w="100%">
          <VStack flex="1" bg="rgba(255,255,255,0.15)" borderRadius="14px" py="12px" alignItems="center">
            <Text fontSize="20px" fontWeight="800" color="white">
              {streakData?.longestStreak || 0}
            </Text>
            <Text fontSize="10px" fontWeight="600" color="rgba(255,255,255,0.8)">
              Longest Streak
            </Text>
          </VStack>
          <VStack flex="1" bg="rgba(255,255,255,0.15)" borderRadius="14px" py="12px" alignItems="center">
            <Text fontSize="20px" fontWeight="800" color="white">
              {shareData.stepsFormatted}
            </Text>
            <Text fontSize="10px" fontWeight="600" color="rgba(255,255,255,0.8)">
              Total Steps
            </Text>
          </VStack>
        </HStack>

        <Text fontSize="10px" color="rgba(255,255,255,0.5)" mt="4px">
          {shareData.userName} · TravelFit
        </Text>
      </VStack>
    </Box>
  )

  const renderMilestoneCard = () => {
    const milestonePercents = [25, 50, 75, 100]
    const currentMilestone = milestonePercents.find(
      (m) => parseFloat(shareData.progress) >= m
    )

    return (
      <Box
        bg={{
          linearGradient: {
            colors: ['primary.400', 'primary.300'],
            start: [0, 0],
            end: [1, 1]
          }
        }}
        borderRadius="24px"
        p="24px"
        mx="20px"
        shadow="6"
        bgColor="primary.300"
      >
        <VStack space="4" alignItems="center">
          <Text fontSize="12px" fontWeight="700" color="accent.sunset" letterSpacing="2px">
            MILESTONE REACHED
          </Text>

          <Text fontSize="60px" fontWeight="900" color="white">
            {currentMilestone || parseFloat(shareData.progress).toFixed(0)}%
          </Text>

          <Text
            fontSize="16px"
            fontWeight="700"
            color="white"
            textAlign="center"
          >
            {shareData.starting} → {shareData.destination}
          </Text>

          <HStack space="3" w="100%">
            <VStack flex="1" bg="rgba(255,255,255,0.1)" borderRadius="14px" py="10px" alignItems="center">
              <Text fontSize="18px" fontWeight="800" color="white">
                {shareData.distanceWalked}
              </Text>
              <Text fontSize="10px" fontWeight="600" color="rgba(255,255,255,0.6)">
                KM Walked
              </Text>
            </VStack>
            <VStack flex="1" bg="rgba(255,255,255,0.1)" borderRadius="14px" py="10px" alignItems="center">
              <Text fontSize="18px" fontWeight="800" color="white">
                {shareData.totalDistance}
              </Text>
              <Text fontSize="10px" fontWeight="600" color="rgba(255,255,255,0.6)">
                KM Total
              </Text>
            </VStack>
          </HStack>

          {/* Progress Bar */}
          <VStack w="100%" mt="4px">
            <Box h="8px" bg="rgba(255,255,255,0.15)" borderRadius="4px" overflow="hidden">
              <Box
                w={`${Math.min(parseFloat(shareData.progress), 100)}%`}
                h="100%"
                bg="secondary.400"
                borderRadius="4px"
              />
            </Box>
          </VStack>

          <Text fontSize="10px" color="rgba(255,255,255,0.4)" mt="2px">
            {shareData.daysOnRoute} days · TravelFit
          </Text>
        </VStack>
      </Box>
    )
  }

  const cardTypes = [
    { key: SHARE_CARD_TYPES.PROGRESS, label: 'Journey', color: 'primary.400' },
    { key: SHARE_CARD_TYPES.MILESTONE, label: 'Milestone', color: 'primary.300' },
    { key: SHARE_CARD_TYPES.STREAK, label: 'Streak', color: 'accent.coral' },
    ...(shareData.isCompleted
      ? [{ key: SHARE_CARD_TYPES.COMPLETION, label: 'Complete', color: 'secondary.600' }]
      : [])
  ]

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F6FA' }}>
      <StatusBar barStyle="dark-content" />

      <HStack px="20px" py="8px" alignItems="center">
        <Pressable onPress={goBack} p="4px" mr="8px">
          <BackSVG />
        </Pressable>
        <Text fontSize="20px" fontWeight="700" color="primary.400" flex="1">
          Share Your Journey
        </Text>
      </HStack>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Card Type Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
        >
          {cardTypes.map((card) => (
            <Pressable
              key={card.key}
              onPress={() => setSelectedCard(card.key)}
              mr="8px"
            >
              <Box
                bg={selectedCard === card.key ? card.color : 'white'}
                borderRadius="10px"
                px="16px"
                py="8px"
                borderWidth="1px"
                borderColor={selectedCard === card.key ? card.color : 'border'}
              >
                <Text
                  fontSize="13px"
                  fontWeight="600"
                  color={selectedCard === card.key ? 'white' : 'primary.200'}
                >
                  {card.label}
                </Text>
              </Box>
            </Pressable>
          ))}
        </ScrollView>

        {/* Selected Card Preview */}
        {selectedCard === SHARE_CARD_TYPES.PROGRESS && renderProgressCard()}
        {selectedCard === SHARE_CARD_TYPES.COMPLETION && renderCompletionCard()}
        {selectedCard === SHARE_CARD_TYPES.STREAK && renderStreakCard()}
        {selectedCard === SHARE_CARD_TYPES.MILESTONE && renderMilestoneCard()}

        {/* Share Button */}
        <Button
          mt="24px"
          mx="20px"
          bg="primary.400"
          borderRadius="16px"
          py="16px"
          _text={{ fontSize: '16px', fontWeight: '700', color: 'white' }}
          _pressed={{ bg: 'primary.500' }}
          onPress={handleShare}
        >
          Share This Card
        </Button>

        {/* Share Tips */}
        <Box bg="white" borderRadius="16px" p="16px" mx="20px" mt="16px" borderWidth="1px" borderColor="border">
          <Text fontSize="13px" fontWeight="700" color="primary.100" mb="8px" textTransform="uppercase">
            Share Tips
          </Text>
          <VStack space="2">
            <HStack alignItems="center">
              <Box w="6px" h="6px" borderRadius="3px" bg="secondary.400" mr="8px" />
              <Text fontSize="13px" color="primary.200">
                Share your progress to motivate friends to join
              </Text>
            </HStack>
            <HStack alignItems="center">
              <Box w="6px" h="6px" borderRadius="3px" bg="accent.sky" mr="8px" />
              <Text fontSize="13px" color="primary.200">
                Challenge friends to race you on the same route
              </Text>
            </HStack>
            <HStack alignItems="center">
              <Box w="6px" h="6px" borderRadius="3px" bg="accent.sunset" mr="8px" />
              <Text fontSize="13px" color="primary.200">
                Post milestones to celebrate your achievements
              </Text>
            </HStack>
          </VStack>
        </Box>
      </ScrollView>
    </SafeAreaView>
  )
}

export default ShareMoment
