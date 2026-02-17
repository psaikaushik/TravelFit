import React, { useState, useEffect, useCallback } from 'react'
import { SafeAreaView, StatusBar, ScrollView, Alert, RefreshControl } from 'react-native'
import {
  Box,
  Text,
  VStack,
  HStack,
  Flex,
  Pressable,
  Button,
  Badge
} from 'native-base'
import { useNavigation, useRoute } from '@react-navigation/native'
import auth from '@react-native-firebase/auth'
import {
  getRaceDetails,
  subscribeRace,
  startRace,
  updateRaceProgress,
  leaveRace,
  inviteToRace
} from '../services/races'
import { getFriendsList } from '../services/friends'
import { shareRaceResult } from '../services/shareMoments'
import { prettifyNum } from '../services/helpers'
import BackSVG from '../assets/icons/back.svg'

const POSITION_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']
const POSITION_LABELS = ['1st', '2nd', '3rd']

const RaceDetail = () => {
  const { goBack } = useNavigation()
  const route = useRoute()
  const { raceId } = route.params || {}
  const [race, setRace] = useState(null)
  const [friends, setFriends] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const uid = auth().currentUser?.uid

  useEffect(() => {
    if (!raceId) return
    const unsubscribe = subscribeRace(raceId, (data) => {
      setRace(data)
    })
    return unsubscribe
  }, [raceId])

  useEffect(() => {
    getFriendsList().then(setFriends)
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await updateRaceProgress(raceId)
    setRefreshing(false)
  }, [raceId])

  const handleStart = async () => {
    const success = await startRace(raceId)
    if (!success) {
      Alert.alert('Cannot Start', 'Only the race creator can start the race.')
    }
  }

  const handleUpdateProgress = async () => {
    await updateRaceProgress(raceId)
  }

  const handleLeave = () => {
    Alert.alert('Leave Race', 'Are you sure you want to leave this race?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          await leaveRace(raceId)
          goBack()
        }
      }
    ])
  }

  const handleInviteFriend = async (friend) => {
    await inviteToRace(raceId, friend.id)
    Alert.alert('Invited!', `Race invite sent to ${friend.name}`)
  }

  const handleShareResult = () => {
    if (!race) return
    const myPosition =
      (race.participantsList || []).findIndex((p) => p.id === uid) + 1
    shareRaceResult(
      race.routeName,
      myPosition,
      (race.participantsList || []).length
    )
  }

  if (!race) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F6FA' }}>
        <StatusBar barStyle="dark-content" />
        <Flex flex="1" align="center" justify="center">
          <Text fontSize="16px" color="primary.100">Loading race...</Text>
        </Flex>
      </SafeAreaView>
    )
  }

  const isCreator = race.creator === uid
  const participants = race.participantsList || []
  const myEntry = participants.find((p) => p.id === uid)
  const isWaiting = race.status === 'waiting'
  const isActive = race.status === 'active'
  const isCompleted = race.status === 'completed'

  // Friends not yet in this race
  const invitableFriends = friends.filter(
    (f) => !participants.find((p) => p.id === f.id)
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F6FA' }}>
      <StatusBar barStyle="dark-content" />

      <HStack px="20px" py="8px" alignItems="center">
        <Pressable onPress={goBack} p="4px" mr="8px">
          <BackSVG />
        </Pressable>
        <Text fontSize="20px" fontWeight="700" color="primary.400" flex="1" numberOfLines={1}>
          {race.routeName}
        </Text>
        <Badge
          bg={
            isWaiting
              ? 'accent.sunset'
              : isActive
              ? 'secondary.600'
              : 'primary.100'
          }
          rounded="full"
          _text={{ fontSize: '10px', color: 'white', fontWeight: '700' }}
          px="8px"
        >
          {isWaiting ? 'Waiting' : isActive ? 'Active' : 'Completed'}
        </Badge>
      </HStack>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Race Info Card */}
        <Box bg="primary.400" borderRadius="20px" p="20px" mb="16px">
          <Text fontSize="14px" fontWeight="600" color="secondary.400" mb="4px">
            {race.starting?.title || 'Start'} → {race.destination?.title || 'End'}
          </Text>
          <HStack justifyContent="space-around" mt="12px">
            <VStack alignItems="center">
              <Text fontSize="28px" fontWeight="900" color="white">
                {race.distance}
              </Text>
              <Text fontSize="11px" color="secondary.100">KM</Text>
            </VStack>
            <VStack alignItems="center">
              <Text fontSize="28px" fontWeight="900" color="white">
                {participants.length}
              </Text>
              <Text fontSize="11px" color="secondary.100">Racers</Text>
            </VStack>
            {myEntry && (
              <VStack alignItems="center">
                <Text fontSize="28px" fontWeight="900" color="secondary.400">
                  {myEntry.progress.toFixed(0)}%
                </Text>
                <Text fontSize="11px" color="secondary.100">Your Progress</Text>
              </VStack>
            )}
          </HStack>
        </Box>

        {/* Action Buttons */}
        {isWaiting && isCreator && participants.length >= 1 && (
          <Button
            bg="secondary.400"
            borderRadius="14px"
            py="14px"
            mb="12px"
            onPress={handleStart}
            _text={{ fontSize: '16px', fontWeight: '700', color: 'primary.400' }}
            _pressed={{ bg: 'secondary.600' }}
          >
            Start Race
          </Button>
        )}

        {isActive && (
          <Button
            bg="secondary.400"
            borderRadius="14px"
            py="14px"
            mb="12px"
            onPress={handleUpdateProgress}
            _text={{ fontSize: '16px', fontWeight: '700', color: 'primary.400' }}
            _pressed={{ bg: 'secondary.600' }}
          >
            Sync My Progress
          </Button>
        )}

        {isCompleted && (
          <Button
            bg="accent.ocean"
            borderRadius="14px"
            py="14px"
            mb="12px"
            onPress={handleShareResult}
            _text={{ fontSize: '16px', fontWeight: '700', color: 'white' }}
            _pressed={{ bg: 'accent.ocean', opacity: 0.8 }}
          >
            Share Race Result
          </Button>
        )}

        {/* Leaderboard */}
        <Text
          fontSize="13px"
          fontWeight="700"
          color="primary.100"
          mb="10px"
          textTransform="uppercase"
          letterSpacing="0.5px"
        >
          Race Standings
        </Text>

        {participants.map((participant, index) => {
          const isMe = participant.id === uid
          const positionColor = POSITION_COLORS[index] || '#E8EAF0'

          return (
            <HStack
              key={participant.id}
              bg={isMe ? 'secondary.50' : 'white'}
              borderRadius="14px"
              px="16px"
              py="14px"
              mb="8px"
              alignItems="center"
              borderWidth={isMe ? '2px' : '1px'}
              borderColor={isMe ? 'secondary.400' : 'border'}
            >
              {/* Position */}
              <Flex
                w="36px"
                h="36px"
                borderRadius="18px"
                bg={index < 3 ? positionColor : 'primary.50'}
                align="center"
                justify="center"
                mr="12px"
              >
                <Text
                  fontSize="14px"
                  fontWeight="800"
                  color={index < 3 ? 'primary.400' : 'primary.200'}
                >
                  {index + 1}
                </Text>
              </Flex>

              {/* Name + Steps */}
              <VStack flex="1">
                <HStack alignItems="center">
                  <Text
                    fontSize="15px"
                    fontWeight={isMe ? '700' : '600'}
                    color="primary.400"
                  >
                    {participant.name}
                  </Text>
                  {isMe && (
                    <Badge
                      bg="secondary.400"
                      rounded="full"
                      ml="6px"
                      _text={{
                        fontSize: '9px',
                        color: 'primary.400',
                        fontWeight: '700'
                      }}
                      px="6px"
                      py="0"
                    >
                      YOU
                    </Badge>
                  )}
                </HStack>
                <Text fontSize="12px" color="primary.100">
                  {prettifyNum(participant.steps)} steps · {participant.distance.toFixed(1)} km
                </Text>
              </VStack>

              {/* Progress */}
              <VStack alignItems="flex-end">
                <Text
                  fontSize="18px"
                  fontWeight="800"
                  color={
                    participant.progress >= 100
                      ? 'secondary.900'
                      : 'primary.400'
                  }
                >
                  {participant.progress.toFixed(0)}%
                </Text>
                {participant.finishedAt && (
                  <Text fontSize="10px" color="secondary.600" fontWeight="600">
                    Finished
                  </Text>
                )}
              </VStack>
            </HStack>
          )
        })}

        {/* Progress Visualization */}
        <Box bg="white" borderRadius="16px" p="16px" mb="16px" mt="8px" borderWidth="1px" borderColor="border">
          <Text fontSize="13px" fontWeight="700" color="primary.100" mb="12px" textTransform="uppercase">
            Race Progress
          </Text>
          {participants.map((p, idx) => {
            const barColors = ['#C4EB64', '#4ECDC4', '#FFB347', '#A78BFA', '#FF6B6B']
            return (
              <VStack key={p.id} mb="10px">
                <HStack justifyContent="space-between" mb="4px">
                  <Text fontSize="12px" fontWeight="600" color="primary.300">
                    {p.name.split(' ')[0]}
                  </Text>
                  <Text fontSize="12px" fontWeight="600" color="primary.200">
                    {p.progress.toFixed(1)}%
                  </Text>
                </HStack>
                <Box h="10px" bg="primary.50" borderRadius="5px" overflow="hidden">
                  <Box
                    w={`${Math.min(p.progress, 100)}%`}
                    h="100%"
                    bg={barColors[idx % barColors.length]}
                    borderRadius="5px"
                  />
                </Box>
              </VStack>
            )
          })}
        </Box>

        {/* Invite Friends */}
        {(isWaiting || isActive) && invitableFriends.length > 0 && (
          <>
            <Text
              fontSize="13px"
              fontWeight="700"
              color="primary.100"
              mb="10px"
              mt="4px"
              textTransform="uppercase"
              letterSpacing="0.5px"
            >
              Invite Friends
            </Text>
            {invitableFriends.slice(0, 5).map((friend) => (
              <HStack
                key={friend.id}
                bg="white"
                borderRadius="14px"
                px="16px"
                py="12px"
                mb="6px"
                alignItems="center"
                borderWidth="1px"
                borderColor="border"
              >
                <Flex
                  w="36px"
                  h="36px"
                  borderRadius="18px"
                  bg="accent.sky"
                  align="center"
                  justify="center"
                >
                  <Text fontSize="16px" fontWeight="700" color="white">
                    {(friend.name || 'U')[0].toUpperCase()}
                  </Text>
                </Flex>
                <Text flex="1" ml="10px" fontSize="14px" fontWeight="600" color="primary.400">
                  {friend.name}
                </Text>
                <Pressable
                  onPress={() => handleInviteFriend(friend)}
                  bg="accent.ocean"
                  px="12px"
                  py="6px"
                  borderRadius="8px"
                >
                  <Text fontSize="12px" fontWeight="600" color="white">
                    Invite
                  </Text>
                </Pressable>
              </HStack>
            ))}
          </>
        )}

        {/* Leave Race */}
        {!isCompleted && (
          <Pressable
            onPress={handleLeave}
            mt="16px"
            alignItems="center"
            py="12px"
          >
            <Text fontSize="14px" fontWeight="600" color="accent.coral">
              Leave Race
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default RaceDetail
