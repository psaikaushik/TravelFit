import React, { useState, useCallback } from 'react'
import { SafeAreaView, StatusBar, FlatList, RefreshControl } from 'react-native'
import {
  Box,
  Text,
  VStack,
  HStack,
  Flex,
  Pressable,
  Badge
} from 'native-base'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import auth from '@react-native-firebase/auth'
import {
  getGlobalLeaderboard,
  getFriendsLeaderboard,
  getRouteLeaderboard
} from '../services/leaderboards'
import { prettifyNum } from '../services/helpers'
import { CURATED_ROUTES } from '../data/curatedRoutes'
import BackSVG from '../assets/icons/back.svg'

const PERIOD_LABELS = { weekly: 'This Week', monthly: 'This Month', alltime: 'All Time' }
const SORT_OPTIONS = [
  { key: 'steps', label: 'Steps' },
  { key: 'distance', label: 'Distance' },
  { key: 'landmarks', label: 'Landmarks' }
]

const PODIUM_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']

const Leaderboards = () => {
  const { goBack } = useNavigation()
  const [activeTab, setActiveTab] = useState('global')
  const [period, setPeriod] = useState('weekly')
  const [sortBy, setSortBy] = useState('steps')
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const uid = auth().currentUser?.uid

  const { data: globalData = [], refetch: refetchGlobal } = useQuery(
    ['leaderboard-global', period, sortBy],
    () => getGlobalLeaderboard(period, sortBy),
    { enabled: activeTab === 'global' }
  )

  const { data: friendsData = [], refetch: refetchFriends } = useQuery(
    ['leaderboard-friends', sortBy],
    () => getFriendsLeaderboard(sortBy),
    { enabled: activeTab === 'friends' }
  )

  const { data: routeData = [], refetch: refetchRoute } = useQuery(
    ['leaderboard-route', selectedRoute],
    () => getRouteLeaderboard(selectedRoute),
    { enabled: activeTab === 'routes' && !!selectedRoute }
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    if (activeTab === 'global') await refetchGlobal()
    else if (activeTab === 'friends') await refetchFriends()
    else if (activeTab === 'routes') await refetchRoute()
    setRefreshing(false)
  }, [activeTab, refetchGlobal, refetchFriends, refetchRoute])

  const getLeaderboardData = () => {
    if (activeTab === 'global') return globalData
    if (activeTab === 'friends') return friendsData
    if (activeTab === 'routes') return routeData
    return []
  }

  const renderPodium = () => {
    const data = getLeaderboardData()
    const top3 = data.slice(0, 3)
    if (top3.length === 0) return null

    // Reorder for podium display: 2nd, 1st, 3rd
    const podiumOrder = top3.length >= 3
      ? [top3[1], top3[0], top3[2]]
      : top3.length === 2
      ? [top3[1], top3[0]]
      : [top3[0]]

    const podiumHeights = [90, 120, 70]

    return (
      <HStack justifyContent="center" alignItems="flex-end" mb="20px" mt="8px" px="20px">
        {podiumOrder.map((entry, idx) => {
          const realIdx = top3.length >= 3 ? [1, 0, 2][idx] : top3.length === 2 ? [1, 0][idx] : [0][idx]
          const height = podiumHeights[realIdx] || 70
          const isMe = entry.isMe

          return (
            <VStack
              key={entry.id}
              flex="1"
              alignItems="center"
              mx="4px"
            >
              <Flex
                w={realIdx === 0 ? '52px' : '44px'}
                h={realIdx === 0 ? '52px' : '44px'}
                borderRadius={realIdx === 0 ? '26px' : '22px'}
                bg={isMe ? 'secondary.400' : PODIUM_COLORS[realIdx]}
                align="center"
                justify="center"
                mb="6px"
                borderWidth={isMe ? '3px' : '0'}
                borderColor={isMe ? 'secondary.900' : 'transparent'}
              >
                <Text
                  fontSize={realIdx === 0 ? '20px' : '16px'}
                  fontWeight="900"
                  color={isMe ? 'primary.400' : 'primary.400'}
                >
                  {entry.name?.[0]?.toUpperCase() || '?'}
                </Text>
              </Flex>
              <Text
                fontSize="12px"
                fontWeight={isMe ? '700' : '600'}
                color={isMe ? 'secondary.900' : 'primary.400'}
                numberOfLines={1}
                textAlign="center"
              >
                {isMe ? 'You' : entry.name?.split(' ')[0]}
              </Text>
              <Text fontSize="11px" fontWeight="600" color="primary.100">
                {activeTab === 'routes'
                  ? `${entry.completionDays}d`
                  : prettifyNum(entry[sortBy] || 0)}
              </Text>
              <Box
                w="100%"
                h={`${height}px`}
                bg={PODIUM_COLORS[realIdx]}
                borderTopRadius="10px"
                mt="6px"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="20px" fontWeight="900" color="primary.400">
                  #{realIdx + 1}
                </Text>
              </Box>
            </VStack>
          )
        })}
      </HStack>
    )
  }

  const renderLeaderboardItem = ({ item, index }) => {
    if (index < 3) return null // Already shown in podium
    const isMe = item.isMe

    return (
      <HStack
        bg={isMe ? 'secondary.50' : 'white'}
        borderRadius="14px"
        px="16px"
        py="12px"
        mb="6px"
        alignItems="center"
        borderWidth={isMe ? '2px' : '1px'}
        borderColor={isMe ? 'secondary.400' : 'border'}
      >
        <Text
          fontSize="14px"
          fontWeight="800"
          color="primary.200"
          w="30px"
        >
          #{item.rank}
        </Text>
        <Flex
          w="36px"
          h="36px"
          borderRadius="18px"
          bg={isMe ? 'secondary.400' : 'primary.50'}
          align="center"
          justify="center"
          mr="10px"
        >
          <Text
            fontSize="15px"
            fontWeight="700"
            color={isMe ? 'primary.400' : 'primary.200'}
          >
            {(item.name || 'U')[0].toUpperCase()}
          </Text>
        </Flex>
        <VStack flex="1">
          <HStack alignItems="center">
            <Text
              fontSize="14px"
              fontWeight={isMe ? '700' : '600'}
              color="primary.400"
            >
              {isMe ? 'You' : item.name}
            </Text>
          </HStack>
          {activeTab !== 'routes' && (
            <Text fontSize="11px" color="primary.100">
              {prettifyNum(item.distance || 0)} km · {item.landmarks || 0} landmarks
            </Text>
          )}
        </VStack>
        <Text
          fontSize="16px"
          fontWeight="800"
          color={isMe ? 'secondary.900' : 'primary.400'}
        >
          {activeTab === 'routes'
            ? `${item.completionDays}d`
            : prettifyNum(item[sortBy] || 0)}
        </Text>
      </HStack>
    )
  }

  const renderRouteSelector = () => (
    <VStack mb="12px">
      <Text
        fontSize="13px"
        fontWeight="700"
        color="primary.100"
        mb="8px"
        textTransform="uppercase"
      >
        Select a Route
      </Text>
      {CURATED_ROUTES.map((route) => (
        <Pressable
          key={route.id}
          onPress={() => setSelectedRoute(route.id)}
        >
          <HStack
            bg={selectedRoute === route.id ? 'secondary.50' : 'white'}
            borderRadius="12px"
            px="14px"
            py="10px"
            mb="6px"
            alignItems="center"
            borderWidth={selectedRoute === route.id ? '2px' : '1px'}
            borderColor={selectedRoute === route.id ? 'secondary.400' : 'border'}
          >
            <Text flex="1" fontSize="14px" fontWeight="600" color="primary.400">
              {route.title}
            </Text>
            <Text fontSize="12px" color="primary.100">
              {route.distance} km
            </Text>
          </HStack>
        </Pressable>
      ))}
    </VStack>
  )

  const data = getLeaderboardData()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F6FA' }}>
      <StatusBar barStyle="dark-content" />

      <VStack px="20px" pt="8px" pb="4px">
        <HStack alignItems="center" mb="4px">
          <Pressable onPress={goBack} p="4px" mr="8px">
            <BackSVG />
          </Pressable>
          <Text fontSize="28px" fontWeight="800" color="primary.400" flex="1">
            Leaderboards
          </Text>
        </HStack>

        {/* Tab Switcher */}
        <HStack mt="4px" bg="white" borderRadius="12px" p="4px" borderWidth="1px" borderColor="border">
          {['global', 'friends', 'routes'].map((tab) => (
            <Pressable
              key={tab}
              flex="1"
              onPress={() => setActiveTab(tab)}
              bg={activeTab === tab ? 'primary.400' : 'transparent'}
              borderRadius="10px"
              py="8px"
              alignItems="center"
            >
              <Text
                fontSize="13px"
                fontWeight="600"
                color={activeTab === tab ? 'white' : 'primary.200'}
                textTransform="capitalize"
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </HStack>

        {/* Period Switcher (Global tab only) */}
        {activeTab === 'global' && (
          <HStack mt="8px" space="2">
            {Object.entries(PERIOD_LABELS).map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => setPeriod(key)}
                bg={period === key ? 'secondary.400' : 'white'}
                borderRadius="8px"
                px="12px"
                py="6px"
                borderWidth="1px"
                borderColor={period === key ? 'secondary.600' : 'border'}
              >
                <Text
                  fontSize="12px"
                  fontWeight="600"
                  color={period === key ? 'primary.400' : 'primary.200'}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </HStack>
        )}

        {/* Sort Switcher (Global and Friends tabs) */}
        {activeTab !== 'routes' && (
          <HStack mt="8px" space="2">
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => setSortBy(opt.key)}
                bg={sortBy === opt.key ? 'accent.ocean' : 'white'}
                borderRadius="8px"
                px="12px"
                py="6px"
                borderWidth="1px"
                borderColor={sortBy === opt.key ? 'accent.ocean' : 'border'}
              >
                <Text
                  fontSize="12px"
                  fontWeight="600"
                  color={sortBy === opt.key ? 'white' : 'primary.200'}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </HStack>
        )}
      </VStack>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderLeaderboardItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            {activeTab === 'routes' && !selectedRoute && renderRouteSelector()}
            {data.length >= 1 && renderPodium()}
          </>
        }
        ListEmptyComponent={
          activeTab === 'routes' && !selectedRoute ? null : (
            <Flex align="center" justify="center" py="60px">
              <Text fontSize="16px" fontWeight="600" color="primary.100" textAlign="center">
                {activeTab === 'friends'
                  ? 'Add friends to see them on the leaderboard!'
                  : 'No leaderboard data yet. Keep walking!'}
              </Text>
            </Flex>
          )
        }
      />
    </SafeAreaView>
  )
}

export default Leaderboards
