import React, { useState } from 'react'
import { SafeAreaView, StatusBar } from 'react-native'
import {
  Box,
  Text,
  VStack,
  HStack,
  Flex,
  Pressable,
  ScrollView,
  Progress,
  Button
} from 'native-base'
import { useNavigation } from '@react-navigation/native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CHALLENGE_TEMPLATES,
  getActiveChallenges,
  getCompletedChallenges,
  joinChallenge
} from '../services/challenges'
import { prettifyNum } from '../services/helpers'
import BackSVG from '../assets/icons/back.svg'

const TYPE_COLORS = {
  daily: { bg: 'blue.100', text: 'blue.700', label: 'Daily' },
  weekly: { bg: 'orange.100', text: 'orange.700', label: 'Weekly' },
  monthly: { bg: 'purple.100', text: 'purple.700', label: 'Monthly' },
  streak: { bg: 'green.100', text: 'green.700', label: 'Streak' }
}

const Challenges = () => {
  const { goBack } = useNavigation()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState(0)

  const { data: activeChallenges = [] } = useQuery(
    ['active-challenges'],
    getActiveChallenges
  )

  const { data: completedChallenges = [] } = useQuery(
    ['completed-challenges'],
    getCompletedChallenges
  )

  const handleJoin = async (challengeId) => {
    await joinChallenge(challengeId)
    queryClient.invalidateQueries(['active-challenges'])
  }

  const isAlreadyJoined = (challengeId) => {
    return activeChallenges.some((c) => c.id === challengeId)
  }

  const isAlreadyCompleted = (challengeId) => {
    return completedChallenges.some((c) => c.id === challengeId)
  }

  const renderTypeBadge = (type) => {
    const config = TYPE_COLORS[type] || TYPE_COLORS.daily
    return (
      <Box px="10px" py="2px" borderRadius="12px" bg={config.bg}>
        <Text fontSize="12px" fontWeight="700" color={config.text}>
          {config.label}
        </Text>
      </Box>
    )
  }

  const renderAvailableCard = (template) => {
    const joined = isAlreadyJoined(template.id)
    const completed = isAlreadyCompleted(template.id)

    return (
      <Box key={template.id} bg="white" borderRadius="16px" p="16px">
        <VStack space="2">
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="18px" fontWeight="700" color="primary.400" flex="1" numberOfLines={1}>
              {template.title}
            </Text>
            {renderTypeBadge(template.type)}
          </HStack>

          <Text fontSize="13px" color="gray.500" lineHeight="18px">
            {template.description}
          </Text>

          <HStack alignItems="center" space="3">
            <VStack>
              <Text fontSize="11px" color="gray.400">Target</Text>
              <Text fontSize="14px" fontWeight="700" color="primary.400">
                {prettifyNum(template.targetSteps)} steps
              </Text>
            </VStack>
            {template.streakDays && (
              <VStack>
                <Text fontSize="11px" color="gray.400">Duration</Text>
                <Text fontSize="14px" fontWeight="700" color="primary.400">
                  {template.streakDays} days
                </Text>
              </VStack>
            )}
          </HStack>

          <HStack alignItems="center" space="2">
            <Box px="10px" py="4px" borderRadius="8px" bg="gray.100">
              <Text fontSize="12px" color="gray.600" fontWeight="500">
                Reward: {template.reward}
              </Text>
            </Box>
          </HStack>

          {completed ? (
            <Box
              mt="4px"
              py="10px"
              borderRadius="12px"
              bg="green.100"
              alignItems="center"
            >
              <Text fontSize="14px" fontWeight="700" color="green.700">
                Completed
              </Text>
            </Box>
          ) : joined ? (
            <Box
              mt="4px"
              py="10px"
              borderRadius="12px"
              bg="gray.100"
              alignItems="center"
            >
              <Text fontSize="14px" fontWeight="700" color="gray.500">
                Already Joined
              </Text>
            </Box>
          ) : (
            <Button
              mt="4px"
              bg="primary.400"
              borderRadius="12px"
              _pressed={{ bg: 'primary.500' }}
              onPress={() => handleJoin(template.id)}
              accessibilityLabel={`Join ${template.title} challenge`}
              accessibilityRole="button"
            >
              <Text fontSize="14px" fontWeight="700" color="white">
                Join Challenge
              </Text>
            </Button>
          )}
        </VStack>
      </Box>
    )
  }

  const renderActiveCard = (challenge) => {
    const progressPercent = challenge.targetSteps > 0
      ? Math.min((challenge.progress / challenge.targetSteps) * 100, 100)
      : 0

    return (
      <Box key={challenge.id} bg="white" borderRadius="16px" p="16px">
        <VStack space="2">
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="18px" fontWeight="700" color="primary.400" flex="1" numberOfLines={1}>
              {challenge.title}
            </Text>
            {renderTypeBadge(challenge.type)}
          </HStack>

          <Text fontSize="13px" color="gray.500">
            {challenge.description}
          </Text>

          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="13px" color="gray.600" fontWeight="600">
              {prettifyNum(challenge.progress)} / {prettifyNum(challenge.targetSteps)} steps
            </Text>
            <Text fontSize="13px" fontWeight="700" color="primary.400">
              {Math.round(progressPercent)}%
            </Text>
          </HStack>

          <Progress
            colorScheme="green"
            value={progressPercent}
            bg="gray.200"
            size="sm"
          />

          <HStack alignItems="center" space="2">
            <Box px="10px" py="4px" borderRadius="8px" bg="gray.100">
              <Text fontSize="12px" color="gray.600" fontWeight="500">
                Reward: {challenge.reward}
              </Text>
            </Box>
          </HStack>
        </VStack>
      </Box>
    )
  }

  const renderCompletedCard = (challenge) => {
    return (
      <Box key={`${challenge.id}-${challenge.completedDate}`} bg="white" borderRadius="16px" p="16px">
        <VStack space="2">
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="18px" fontWeight="700" color="primary.400" flex="1" numberOfLines={1}>
              {challenge.title}
            </Text>
            <Box px="10px" py="2px" borderRadius="12px" bg="green.100">
              <Text fontSize="12px" fontWeight="700" color="green.700">
                Completed
              </Text>
            </Box>
          </HStack>

          <Text fontSize="13px" color="gray.500">
            {challenge.description}
          </Text>

          <HStack alignItems="center" space="3">
            <VStack>
              <Text fontSize="11px" color="gray.400">Steps</Text>
              <Text fontSize="14px" fontWeight="700" color="primary.400">
                {prettifyNum(challenge.targetSteps)}
              </Text>
            </VStack>
            <VStack>
              <Text fontSize="11px" color="gray.400">Reward</Text>
              <Text fontSize="14px" fontWeight="700" color="green.600">
                {challenge.reward}
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </Box>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F3F6' }}>
      <StatusBar barStyle="dark-content" />

      <Flex direction="row" align="center" px="16px" py="12px">
        <Pressable onPress={goBack} p="4px" accessibilityLabel="Go back" accessibilityRole="button">
          <BackSVG />
        </Pressable>
        <Text fontSize="20px" fontWeight="700" ml="12px" accessibilityRole="header">
          Challenges
        </Text>
      </Flex>

      {/* Tab Switcher */}
      <HStack mx="20px" bg="white" borderRadius="12px" p="4px" mb="16px">
        {['Available', 'My Challenges'].map((tab, i) => (
          <Pressable
            key={tab}
            flex="1"
            onPress={() => setActiveTab(i)}
            accessibilityLabel={`Show ${tab.toLowerCase()}`}
            accessibilityRole="tab"
          >
            <Box
              bg={activeTab === i ? 'primary.400' : 'transparent'}
              borderRadius="10px"
              py="10px"
              alignItems="center"
            >
              <Text
                fontSize="14px"
                fontWeight="600"
                color={activeTab === i ? 'white' : 'gray.500'}
              >
                {tab}
              </Text>
            </Box>
          </Pressable>
        ))}
      </HStack>

      <ScrollView flex="1" px="20px" showsVerticalScrollIndicator={false}>
        {/* Available Tab */}
        {activeTab === 0 && (
          <VStack space="3" pb="40px">
            {CHALLENGE_TEMPLATES.map((template) => renderAvailableCard(template))}
          </VStack>
        )}

        {/* My Challenges Tab */}
        {activeTab === 1 && (
          <VStack space="3" pb="40px">
            {activeChallenges.length > 0 && (
              <>
                <Text fontSize="16px" fontWeight="700" color="primary.400" mb="4px">
                  Active
                </Text>
                {activeChallenges.map((challenge) => renderActiveCard(challenge))}
              </>
            )}

            {completedChallenges.length > 0 && (
              <>
                <Text fontSize="16px" fontWeight="700" color="primary.400" mt="12px" mb="4px">
                  Completed
                </Text>
                {completedChallenges.map((challenge) => renderCompletedCard(challenge))}
              </>
            )}

            {activeChallenges.length === 0 && completedChallenges.length === 0 && (
              <VStack alignItems="center" mt="60px" space="3">
                <Text fontSize="18px" fontWeight="600" color="gray.600">
                  No challenges yet
                </Text>
                <Text fontSize="14px" color="gray.400" textAlign="center">
                  Join a challenge from the Available tab{'\n'}to start tracking your progress!
                </Text>
              </VStack>
            )}
          </VStack>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default Challenges
