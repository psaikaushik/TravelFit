import React, { useState, useCallback } from 'react'
import { SafeAreaView, StatusBar, FlatList, Alert, RefreshControl } from 'react-native'
import {
  Box,
  Text,
  VStack,
  HStack,
  Flex,
  Pressable,
  Button,
  Modal,
  Badge
} from 'native-base'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getUserSettings } from '../services/database'
import {
  createRace,
  getMyRaces,
  getOpenRaces,
  joinRace,
  getRaceInvites,
  acceptRaceInvite,
  inviteToRace
} from '../services/races'
import { CURATED_ROUTES } from '../data/curatedRoutes'
import { shareRaceReferral } from '../services/referrals'
import BackSVG from '../assets/icons/back.svg'

const STATUS_COLORS = {
  waiting: { bg: 'accent.sunset', text: 'Waiting' },
  active: { bg: 'secondary.600', text: 'Active' },
  completed: { bg: 'primary.100', text: 'Completed' }
}

const Races = () => {
  const { navigate, goBack } = useNavigation()
  const route = useRoute()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('my')
  const [showCreateRace, setShowCreateRace] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const inviteFriendId = route.params?.inviteFriendId
  const inviteFriendName = route.params?.inviteFriendName

  const { data: settings } = useQuery(['settings'], getUserSettings)
  const { data: myRaces = [], refetch: refetchMyRaces } = useQuery(
    ['my-races'],
    getMyRaces
  )
  const { data: openRaces = [], refetch: refetchOpenRaces } = useQuery(
    ['open-races'],
    getOpenRaces
  )
  const { data: raceInvites = [], refetch: refetchInvites } = useQuery(
    ['race-invites'],
    getRaceInvites
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchMyRaces(), refetchOpenRaces(), refetchInvites()])
    setRefreshing(false)
  }, [refetchMyRaces, refetchOpenRaces, refetchInvites])

  const handleCreateRace = async (routeData) => {
    const raceId = await createRace({
      routeName: routeData.title || routeData.routeName,
      starting: routeData.starting || settings?.starting,
      destination: routeData.destination || settings?.destination,
      distance: routeData.distance || settings?.distance
    })

    const raceName = routeData.title || routeData.routeName || 'TravelFit Race'

    if (raceId && inviteFriendId) {
      await inviteToRace(raceId, inviteFriendId)
      Alert.alert('Race Created', `Race created and invite sent to ${inviteFriendName}!`)
    } else if (raceId) {
      Alert.alert(
        'Race Created!',
        'Invite friends to compete. Share your referral code and both get free Premium!',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Share Invite',
            onPress: () => shareRaceReferral(raceName)
          }
        ]
      )
    }

    setShowCreateRace(false)
    refetchMyRaces()
  }

  const handleCreateFromCurrentRoute = async () => {
    if (!settings?.starting || !settings?.destination) {
      Alert.alert('No Route', 'You need an active route to create a race.')
      return
    }
    await handleCreateRace({
      routeName: `${settings.starting.title} → ${settings.destination.title}`,
      starting: settings.starting,
      destination: settings.destination,
      distance: settings.distance
    })
  }

  const handleJoinRace = async (raceId) => {
    const success = await joinRace(raceId)
    if (success) {
      Alert.alert('Joined!', 'You joined the race. Good luck!')
      refetchMyRaces()
      refetchOpenRaces()
    } else {
      Alert.alert('Unable to Join', 'This race may be full or already completed.')
    }
  }

  const handleAcceptInvite = async (invite) => {
    const success = await acceptRaceInvite(invite.raceId)
    if (success) {
      refetchMyRaces()
      refetchInvites()
    }
  }

  const renderRaceInvite = ({ item }) => (
    <HStack
      bg="white"
      borderRadius="14px"
      px="16px"
      py="14px"
      mb="8px"
      alignItems="center"
      borderWidth="1px"
      borderColor="accent.sunset"
    >
      <VStack flex="1">
        <Text fontSize="15px" fontWeight="600" color="primary.400">
          {item.routeName}
        </Text>
        <Text fontSize="12px" color="primary.100">
          {item.invitedByName} challenged you · {item.distance} km
        </Text>
      </VStack>
      <Pressable
        onPress={() => handleAcceptInvite(item)}
        bg="accent.coral"
        px="14px"
        py="8px"
        borderRadius="10px"
      >
        <Text fontSize="12px" fontWeight="700" color="white">
          Accept
        </Text>
      </Pressable>
    </HStack>
  )

  const renderMyRace = ({ item }) => {
    const statusInfo = STATUS_COLORS[item.status] || STATUS_COLORS.waiting
    const myPosition =
      item.participants.findIndex((p) => p.isMe || p.id === item.creator) + 1

    return (
      <Pressable onPress={() => navigate('RaceDetail', { raceId: item.id })}>
        <Box
          bg="white"
          borderRadius="16px"
          p="16px"
          mb="10px"
          borderWidth="1px"
          borderColor="border"
        >
          <HStack justifyContent="space-between" alignItems="center" mb="8px">
            <Text
              fontSize="16px"
              fontWeight="700"
              color="primary.400"
              flex="1"
              numberOfLines={1}
            >
              {item.routeName}
            </Text>
            <Badge
              bg={statusInfo.bg}
              rounded="full"
              _text={{ fontSize: '10px', color: 'white', fontWeight: '700' }}
              px="8px"
            >
              {statusInfo.text}
            </Badge>
          </HStack>

          <HStack justifyContent="space-between" mb="10px">
            <VStack alignItems="center" flex="1">
              <Text fontSize="18px" fontWeight="800" color="primary.400">
                {item.distance}
              </Text>
              <Text fontSize="11px" color="primary.100">km</Text>
            </VStack>
            <VStack alignItems="center" flex="1">
              <Text fontSize="18px" fontWeight="800" color="primary.400">
                {item.participantCount}
              </Text>
              <Text fontSize="11px" color="primary.100">Racers</Text>
            </VStack>
            <VStack alignItems="center" flex="1">
              <Text fontSize="18px" fontWeight="800" color="secondary.600">
                {item.myProgress.toFixed(0)}%
              </Text>
              <Text fontSize="11px" color="primary.100">Progress</Text>
            </VStack>
          </HStack>

          {/* Participant progress bars */}
          {item.participants.slice(0, 3).map((p, idx) => (
            <HStack key={p.id} alignItems="center" mb="4px">
              <Text
                fontSize="12px"
                fontWeight="600"
                color={idx === 0 ? 'secondary.900' : 'primary.200'}
                w="70px"
                numberOfLines={1}
              >
                #{idx + 1} {p.name.split(' ')[0]}
              </Text>
              <Box flex="1" h="6px" bg="primary.50" borderRadius="3px" overflow="hidden">
                <Box
                  w={`${Math.min(p.progress, 100)}%`}
                  h="100%"
                  bg={idx === 0 ? 'secondary.400' : idx === 1 ? 'accent.sky' : 'accent.sunset'}
                  borderRadius="3px"
                />
              </Box>
              <Text fontSize="11px" fontWeight="600" color="primary.200" ml="6px" w="35px" textAlign="right">
                {p.progress.toFixed(0)}%
              </Text>
            </HStack>
          ))}
        </Box>
      </Pressable>
    )
  }

  const renderOpenRace = ({ item }) => (
    <HStack
      bg="white"
      borderRadius="14px"
      px="16px"
      py="14px"
      mb="8px"
      alignItems="center"
      borderWidth="1px"
      borderColor="border"
    >
      <VStack flex="1">
        <Text fontSize="15px" fontWeight="600" color="primary.400">
          {item.routeName}
        </Text>
        <Text fontSize="12px" color="primary.100">
          by {item.creatorName} · {item.distance} km · {item.participantCount}/{item.maxParticipants} racers
        </Text>
      </VStack>
      <Pressable
        onPress={() => handleJoinRace(item.id)}
        bg="secondary.400"
        px="14px"
        py="8px"
        borderRadius="10px"
      >
        <Text fontSize="12px" fontWeight="700" color="primary.400">
          Join
        </Text>
      </Pressable>
    </HStack>
  )

  const renderCuratedRoute = ({ item }) => (
    <Pressable
      onPress={() =>
        handleCreateRace({
          title: item.title,
          starting: { title: item.origin.name },
          destination: { title: item.destination.name },
          distance: item.distance
        })
      }
    >
      <HStack
        bg="white"
        borderRadius="14px"
        px="16px"
        py="14px"
        mb="8px"
        alignItems="center"
        borderWidth="1px"
        borderColor="border"
      >
        <VStack flex="1">
          <Text fontSize="15px" fontWeight="600" color="primary.400">
            {item.title}
          </Text>
          <Text fontSize="12px" color="primary.100">
            {item.distance} km · {item.difficulty}
          </Text>
        </VStack>
        <Text fontSize="12px" fontWeight="600" color="accent.ocean">
          Select
        </Text>
      </HStack>
    </Pressable>
  )

  const listData = []

  if (activeTab === 'my') {
    if (raceInvites.length > 0) {
      listData.push({
        type: 'section',
        title: `Challenges Received (${raceInvites.length})`
      })
      raceInvites.forEach((i) => listData.push({ ...i, type: 'invite' }))
    }
    if (myRaces.length > 0) {
      listData.push({ type: 'section', title: 'My Races' })
      myRaces.forEach((r) => listData.push({ ...r, type: 'race' }))
    }
  } else {
    if (openRaces.length > 0) {
      listData.push({ type: 'section', title: 'Open Races' })
      openRaces.forEach((r) => listData.push({ ...r, type: 'open' }))
    }
  }

  const renderItem = ({ item }) => {
    if (item.type === 'section') {
      return (
        <Text
          fontSize="13px"
          fontWeight="700"
          color="primary.100"
          mb="8px"
          mt="12px"
          textTransform="uppercase"
          letterSpacing="0.5px"
        >
          {item.title}
        </Text>
      )
    }
    if (item.type === 'invite') return renderRaceInvite({ item })
    if (item.type === 'race') return renderMyRace({ item })
    if (item.type === 'open') return renderOpenRace({ item })
    return null
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F6FA' }}>
      <StatusBar barStyle="dark-content" />

      <VStack px="20px" pt="8px" pb="4px">
        <HStack alignItems="center" mb="4px">
          <Pressable onPress={goBack} p="4px" mr="8px">
            <BackSVG />
          </Pressable>
          <Text fontSize="28px" fontWeight="800" color="primary.400" flex="1">
            Route Races
          </Text>
        </HStack>

        {inviteFriendName && (
          <Box bg="accent.sky" borderRadius="10px" px="14px" py="8px" mb="8px">
            <Text fontSize="13px" fontWeight="600" color="primary.400">
              Creating a race to challenge {inviteFriendName}
            </Text>
          </Box>
        )}

        <HStack mt="4px" bg="white" borderRadius="12px" p="4px" borderWidth="1px" borderColor="border">
          <Pressable
            flex="1"
            onPress={() => setActiveTab('my')}
            bg={activeTab === 'my' ? 'primary.400' : 'transparent'}
            borderRadius="10px"
            py="8px"
            alignItems="center"
          >
            <Text
              fontSize="14px"
              fontWeight="600"
              color={activeTab === 'my' ? 'white' : 'primary.200'}
            >
              My Races
            </Text>
          </Pressable>
          <Pressable
            flex="1"
            onPress={() => setActiveTab('discover')}
            bg={activeTab === 'discover' ? 'primary.400' : 'transparent'}
            borderRadius="10px"
            py="8px"
            alignItems="center"
          >
            <Text
              fontSize="14px"
              fontWeight="600"
              color={activeTab === 'discover' ? 'white' : 'primary.200'}
            >
              Discover
            </Text>
          </Pressable>
        </HStack>

        <Pressable
          mt="12px"
          onPress={() => setShowCreateRace(true)}
          bg="secondary.400"
          borderRadius="12px"
          py="12px"
          alignItems="center"
        >
          <Text fontSize="14px" fontWeight="700" color="primary.400">
            + Create New Race
          </Text>
        </Pressable>
      </VStack>

      <FlatList
        data={listData}
        keyExtractor={(item, index) => `${item.type}-${item.id || index}`}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Flex align="center" justify="center" py="60px">
            <Text fontSize="16px" fontWeight="600" color="primary.100" textAlign="center">
              {activeTab === 'my'
                ? 'No races yet. Create one and challenge your friends!'
                : 'No open races available. Create your own!'}
            </Text>
          </Flex>
        }
      />

      {/* Create Race Modal */}
      <Modal isOpen={showCreateRace} onClose={() => setShowCreateRace(false)} size="full">
        <Modal.Content maxW="100%" borderRadius="20px" mt="auto" mb="0" maxH="75%">
          <Modal.CloseButton />
          <Modal.Header borderBottomWidth="0">
            <Text fontSize="18px" fontWeight="700" color="primary.400">
              Choose a Route for Your Race
            </Text>
          </Modal.Header>
          <Modal.Body px="0">
            {settings?.starting && (
              <Pressable
                onPress={handleCreateFromCurrentRoute}
                mx="16px"
                mb="16px"
              >
                <Box
                  bg="secondary.50"
                  borderRadius="14px"
                  p="16px"
                  borderWidth="2px"
                  borderColor="secondary.400"
                >
                  <Text fontSize="13px" fontWeight="700" color="secondary.900" mb="4px">
                    YOUR CURRENT ROUTE
                  </Text>
                  <Text fontSize="16px" fontWeight="700" color="primary.400">
                    {settings.starting.title} → {settings.destination.title}
                  </Text>
                  <Text fontSize="13px" color="primary.200" mt="2px">
                    {settings.distance} km
                  </Text>
                </Box>
              </Pressable>
            )}

            <Text
              fontSize="13px"
              fontWeight="700"
              color="primary.100"
              mb="8px"
              mx="16px"
              textTransform="uppercase"
            >
              Or Pick a Curated Route
            </Text>

            <FlatList
              data={CURATED_ROUTES}
              keyExtractor={(item) => item.id}
              renderItem={renderCuratedRoute}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            />
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </SafeAreaView>
  )
}

export default Races
