import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Animated, SafeAreaView, StyleSheet, View } from 'react-native'
import { Flex, Text, Avatar, Progress as ProgressNative, Box, HStack, VStack } from 'native-base'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getUserSettings } from '../services/database'
import { getStreakSummary, calculateStreak } from '../services/streak'
import TabScreen from '../components/TabScreen'
import Confetti from '../components/Confetti'
import haptics from '../utils/haptics'
import WalkingIcon from '../assets/icons/walking.svg'
import moment from 'moment'
import {
  calcProgress,
  calcRemaining,
  getStats,
  prettifyNum,
  stepsToDistance
} from '../services/helpers'

const RING_SIZE = 160
const RING_STROKE = 12

const Progress = () => {
  const queryClient = useQueryClient()
  const [showConfetti, setShowConfetti] = useState(false)
  const [activeColor] = useState(new Animated.Value(0))
  const [goalPulse] = useState(new Animated.Value(1))
  const { data: settings } = useQuery(['settings'], getUserSettings)
  const { data: stats } = useQuery(['stats'], getStats)
  const { data: streakData, refetch: refetchStreak } = useQuery(
    ['streak'],
    getStreakSummary,
    { staleTime: 10 * 1000 }
  )
  const { destination, distance, steps, completed } = settings || {}

  const prevGoalReached = useRef(false)

  // Recalculate full streak on mount (expensive, so only once)
  useEffect(() => {
    calculateStreak().then(() => refetchStreak())
  }, [])

  // Goal reached celebration pulse
  useEffect(() => {
    if (streakData?.goalReachedToday && !prevGoalReached.current) {
      prevGoalReached.current = true
      haptics.success()
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
      Animated.sequence([
        Animated.timing(goalPulse, { toValue: 1.15, duration: 300, useNativeDriver: true }),
        Animated.timing(goalPulse, { toValue: 0.95, duration: 200, useNativeDriver: true }),
        Animated.timing(goalPulse, { toValue: 1.05, duration: 150, useNativeDriver: true }),
        Animated.timing(goalPulse, { toValue: 1, duration: 150, useNativeDriver: true })
      ]).start()
    }
  }, [streakData?.goalReachedToday])

  const color = activeColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgb(37,176,37)', 'rgb(184,250,184)']
  })

  Animated.loop(
    Animated.sequence([
      Animated.timing(activeColor, {
        toValue: 1,
        duration: 1000,
        delay: 1000,
        useNativeDriver: false
      }),
      Animated.timing(activeColor, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false
      })
    ])
  ).start()

  const goalProgress = streakData?.progress || 0
  const todaySteps = streakData?.todaySteps || 0
  const dailyGoal = streakData?.dailyGoal || 10000
  const currentStreak = streakData?.currentStreak || 0
  const longestStreak = streakData?.longestStreak || 0
  const goalReached = streakData?.goalReachedToday || false

  // SVG-like ring using border trick
  const ringProgressDeg = Math.min(goalProgress / 100, 1) * 360

  const renderProgressItem = (item) => (
    <Flex
      key={item.id}
      bg="white"
      px="16px"
      borderRadius="16px"
      direction="row"
      align="center"
      accessibilityLabel={`${moment(item.date).format('dddd')}: ${prettifyNum(Math.round(item.steps))} steps, ${stepsToDistance(item.steps)} kilometers`}
    >
      <Flex
        w="70px"
        h="70px"
        mr="16px"
        bg={item.steps >= dailyGoal ? 'green.100' : 'gray.300'}
        align="center"
        justify="center"
        borderRadius="12px"
      >
        <Text variant="place" color={item.steps >= dailyGoal ? 'green.800' : 'primary.400'}>
          {moment(item.date).format('DD').toUpperCase()}
        </Text>
        <Text variant="cityName" color={item.steps >= dailyGoal ? 'green.800' : 'primary.400'}>
          {moment(item.date).format('MMM').toUpperCase()}
        </Text>
      </Flex>
      <Flex
        flex="1"
        py="25px"
        justify="center"
        borderColor="gray.200"
        borderBottomWidth={item.id === 'ThreeDaysBefore' ? '0' : '1px'}
      >
        <Text
          m="0"
          variant="to"
          color="primary.400"
          fontWeight="400"
          numberOfLines={1}
        >
          {stepsToDistance(item.steps)} KM
        </Text>
        <Text
          variant="progress"
          color="gray.500"
          fontWeight="400"
          numberOfLines={1}
        >
          {prettifyNum(Math.round(item.steps))} Steps
        </Text>
      </Flex>
      {item.steps >= dailyGoal && (
        <Text fontSize="18px" accessibilityLabel="Goal reached">
          {'\u2714'}
        </Text>
      )}
    </Flex>
  )

  return (
    <TabScreen>
      <Confetti trigger={showConfetti} />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F3F6' }}>
        {/* Trip Progress Header */}
        <Flex
          h="120px"
          bg="border"
          left="19px"
          right="19px"
          top="11px"
          position="absolute"
          borderRadius="16px"
        />
        <Flex h="100px" bg="secondary.400" borderBottomRadius="16px" />
        <Flex
          h="120px"
          p="20px"
          bg="white"
          left="20px"
          right="20px"
          top="10px"
          position="absolute"
          borderRadius="16px"
        >
          <Flex direction="row">
            <Flex flex="1" direction="row">
              <Text
                flexShrink="1"
                variant="to"
                color="primary"
                mr="12px"
                numberOfLines={1}
              >
                {destination?.title || ''}
              </Text>
              <Text
                variant="to"
                color="primary.400"
                fontWeight="900"
                numberOfLines={1}
              >
                {distance ? prettifyNum(distance.toFixed(2)) : '0'} KM
              </Text>
            </Flex>
          </Flex>
          <Flex flex="1" />
          <Flex direction="row">
            <Flex flex="1">
              <Text variant="progress" mr="10px" numberOfLines={1}>
                {!!completed ? 'Completed' : `${stepsToDistance(steps)} KM`}
              </Text>
            </Flex>
            {!completed && (
              <Text
                variant="progress"
                color="gray.400"
                fontWeight="400"
                numberOfLines={1}
              >
                Remaining {calcRemaining(steps, distance)} KM
              </Text>
            )}
          </Flex>
          <ProgressNative
            colorScheme="green"
            value={calcProgress(steps, distance)}
            mt="6px"
          />
        </Flex>

        {/* Main Content */}
        <Flex flex="1" px="20px" mt="50px" w="100%" minW="100%">
          {/* Daily Goal Ring + Streak */}
          <Animated.View style={{ transform: [{ scale: goalPulse }] }}>
            <Box
              bg="white"
              borderRadius="16px"
              p="20px"
              mb="16px"
              accessibilityLabel={`Daily goal: ${prettifyNum(todaySteps)} of ${prettifyNum(dailyGoal)} steps. ${goalReached ? 'Goal reached!' : `${prettifyNum(dailyGoal - todaySteps)} steps remaining.`} Current streak: ${currentStreak} days.`}
            >
              <HStack space="4" alignItems="center">
                {/* Circular Progress Ring */}
                <View style={styles.ringContainer}>
                  {/* Background ring */}
                  <View style={[styles.ring, styles.ringBg]} />
                  {/* Progress ring - using conic gradient simulation */}
                  <View style={[styles.ring, styles.ringProgress, {
                    borderColor: goalReached ? '#25B025' : '#C4EB64',
                    borderTopColor: ringProgressDeg > 270 ? (goalReached ? '#25B025' : '#C4EB64') : 'transparent',
                    borderRightColor: ringProgressDeg > 180 ? (goalReached ? '#25B025' : '#C4EB64') : 'transparent',
                    borderBottomColor: ringProgressDeg > 90 ? (goalReached ? '#25B025' : '#C4EB64') : 'transparent',
                    borderLeftColor: ringProgressDeg > 0 ? (goalReached ? '#25B025' : '#C4EB64') : 'transparent',
                    transform: [{ rotate: '-45deg' }]
                  }]} />
                  {/* Center content */}
                  <View style={styles.ringCenter}>
                    {goalReached ? (
                      <Text fontSize="28px" textAlign="center" accessibilityLabel="Goal complete checkmark">
                        {'\u2714\uFE0F'}
                      </Text>
                    ) : (
                      <>
                        <Text fontSize="22px" fontWeight="800" color="primary.400" textAlign="center">
                          {Math.round(goalProgress)}%
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                {/* Steps Info */}
                <VStack flex="1" space="1">
                  <Text fontSize="13px" color="gray.500" fontWeight="500">
                    Daily Goal
                  </Text>
                  <Text fontSize="26px" fontWeight="800" color="primary.400">
                    {prettifyNum(todaySteps)}
                  </Text>
                  <Text fontSize="13px" color="gray.500">
                    of {prettifyNum(dailyGoal)} steps
                  </Text>
                  {!goalReached && todaySteps > 0 && (
                    <Text fontSize="12px" color="secondary.900" fontWeight="600" mt="2px">
                      {prettifyNum(dailyGoal - todaySteps)} to go
                    </Text>
                  )}
                  {goalReached && (
                    <Text fontSize="13px" color="green.600" fontWeight="700" mt="2px">
                      Goal reached!
                    </Text>
                  )}
                </VStack>

                {/* Streak Counter */}
                <VStack alignItems="center" space="1">
                  <Box
                    bg={currentStreak > 0 ? 'orange.100' : 'gray.100'}
                    borderRadius="16px"
                    px="14px"
                    py="10px"
                    alignItems="center"
                  >
                    <Text fontSize="24px">
                      {currentStreak > 0 ? '\uD83D\uDD25' : '\u26A1'}
                    </Text>
                    <Text
                      fontSize="22px"
                      fontWeight="900"
                      color={currentStreak > 0 ? 'orange.700' : 'gray.500'}
                    >
                      {currentStreak}
                    </Text>
                  </Box>
                  <Text fontSize="11px" color="gray.500" fontWeight="600">
                    {currentStreak === 1 ? 'day' : 'days'}
                  </Text>
                  {longestStreak > 0 && longestStreak > currentStreak && (
                    <Text fontSize="10px" color="gray.400">
                      Best: {longestStreak}
                    </Text>
                  )}
                </VStack>
              </HStack>
            </Box>
          </Animated.View>

          {/* Today's Walking Widget */}
          <Flex
            h="70px"
            w="100%"
            py="8px"
            pl="10px"
            pr="24px"
            bg="white"
            borderRadius="50px"
            direction="row"
          >
            <Animated.View
              style={{
                width: 20,
                height: 20,
                top: 0,
                right: 2,
                borderRadius: 20,
                position: 'absolute',
                borderColor: 'white',
                borderWidth: 5,
                backgroundColor: color
              }}
            />
            <Avatar w="54px" h="54px" mr="12px" bg="gray.100">
              <WalkingIcon width={30} />
            </Avatar>
            <Flex flex="1" justify="center">
              <Text
                m="0"
                variant="to"
                color="primary.400"
                fontWeight="400"
                numberOfLines={1}
              >
                Today's progress
              </Text>
              <Text
                variant="progress"
                color="gray.400"
                fontWeight="400"
                numberOfLines={1}
              >
                {prettifyNum(Math.round((stats || [{}])[0]?.steps || 0))} Steps
              </Text>
            </Flex>
            <Flex justify="center">
              <Text
                m="0"
                variant="to"
                color="primary.400"
                textAlign="right"
                numberOfLines={1}
              >
                {stepsToDistance((stats || [{}])[0]?.steps || 0)}
              </Text>
              <Text
                variant="progress"
                textAlign="right"
                fontWeight="500"
                numberOfLines={1}
              >
                KM
              </Text>
            </Flex>
          </Flex>

          {/* Daily History */}
          <Flex
            flex="1"
            mt="16px"
            py="10px"
            mb="80px"
            bg="white"
            borderRadius="16px"
          >
            {(stats || []).slice(1).map(renderProgressItem)}
          </Flex>
        </Flex>
      </SafeAreaView>
    </TabScreen>
  )
}

const styles = StyleSheet.create({
  ringContainer: {
    width: RING_SIZE * 0.55,
    height: RING_SIZE * 0.55,
    alignItems: 'center',
    justifyContent: 'center'
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE * 0.55,
    height: RING_SIZE * 0.55,
    borderRadius: (RING_SIZE * 0.55) / 2,
    borderWidth: RING_STROKE
  },
  ringBg: {
    borderColor: '#F0F0F0'
  },
  ringProgress: {
    borderColor: '#C4EB64'
  },
  ringCenter: {
    width: RING_SIZE * 0.55 - RING_STROKE * 2 - 8,
    height: RING_SIZE * 0.55 - RING_STROKE * 2 - 8,
    borderRadius: (RING_SIZE * 0.55 - RING_STROKE * 2 - 8) / 2,
    alignItems: 'center',
    justifyContent: 'center'
  }
})

export default Progress
