import React from 'react'
import { SafeAreaView, StatusBar } from 'react-native'
import {
  Box,
  Text,
  VStack,
  HStack,
  Flex,
  ScrollView,
  Pressable,
  useToast
} from 'native-base'
import { useNavigation } from '@react-navigation/native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCurrentAccountId } from '../services/database'
import { getTripHistory, deleteTripFromHistory } from '../services/tripHistory'
import { prettifyNum, stepsToDistance } from '../services/helpers'
import moment from 'moment'
import BackSVG from '../assets/icons/back.svg'

const TripHistory = () => {
  const { goBack } = useNavigation()
  const toast = useToast()
  const queryClient = useQueryClient()

  const uid = getCurrentAccountId()
  const queryKey = ['trip-history', uid]
  const { data: trips = [], isLoading } = useQuery(
    queryKey,
    () => getTripHistory(uid),
    { enabled: !!uid }
  )

  const handleDelete = async (tripId) => {
    if (!uid || getCurrentAccountId() !== uid) return
    try {
      const updated = await deleteTripFromHistory(tripId, uid)
      if (!updated || getCurrentAccountId() !== uid) return
      await queryClient.invalidateQueries(queryKey)
      if (getCurrentAccountId() === uid) {
        toast.show({ status: 'info', description: 'Trip removed from history' })
      }
    } catch {
      if (getCurrentAccountId() === uid) {
        toast.show({ status: 'error', description: 'Could not remove the trip. Try again.' })
      }
    }
  }

  const formatDuration = (startedTime, completedDate) => {
    if (!startedTime) return ''
    const start = moment(startedTime)
    const end = completedDate ? moment(completedDate) : moment()
    const days = end.diff(start, 'days')
    if (days === 0) return '< 1 day'
    if (days === 1) return '1 day'
    return `${days} days`
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F3F6' }}>
      <StatusBar barStyle="dark-content" />
      <Flex direction="row" align="center" px="16px" py="12px">
        <Pressable onPress={goBack} p="4px" accessibilityLabel="Go back" accessibilityRole="button" testID="trip-history-back">
          <BackSVG />
        </Pressable>
        <Text fontSize="20px" fontWeight="700" ml="12px" accessibilityRole="header">
          Trip History
        </Text>
      </Flex>

      <ScrollView flex="1" px="20px" showsVerticalScrollIndicator={false}>
        {isLoading && (
          <Text textAlign="center" mt="40px" color="gray.500">
            Loading...
          </Text>
        )}

        {!isLoading && trips.length === 0 && (
          <VStack alignItems="center" mt="60px" space="3">
            <Text fontSize="48px">{'🗺️'}</Text>
            <Text fontSize="18px" fontWeight="600" color="gray.600" testID="trip-history-empty">
              No trips yet
            </Text>
            <Text fontSize="14px" color="gray.600" textAlign="center">
              Past trips appear here when you start another route.
            </Text>
          </VStack>
        )}

        <VStack space="3" pb="40px">
          {trips.map((trip) => (
            <Box
              key={trip.id}
              bg="white"
              borderRadius="16px"
              p="16px"
              borderLeftWidth="4px"
              borderLeftColor={trip.completed ? 'green.500' : 'orange.400'}
            >
              <HStack justifyContent="space-between" alignItems="flex-start">
                <VStack flex="1" space="1">
                  <Text fontSize="11px" color="gray.600" fontWeight="500">
                    {trip.startedTime
                      ? moment(trip.startedTime).format('MMM D, YYYY')
                      : ''}
                    {trip.completed
                      ? ` — ${moment(trip.completedDate).format('MMM D, YYYY')}`
                      : ' — Unfinished'}
                  </Text>
                  <Text fontSize="16px" fontWeight="700" color="primary.400" numberOfLines={1} testID="trip-history-start">
                    {trip.starting?.title || 'Unknown'}
                  </Text>
                  <HStack alignItems="center" space="1">
                    <Text fontSize="12px" color="gray.600">{'→'}</Text>
                    <Text fontSize="16px" fontWeight="700" color="primary.400" numberOfLines={1}>
                      {trip.destination?.title || 'Unknown'}
                    </Text>
                  </HStack>
                </VStack>
                {trip.completed && (
                  <Box bg="green.100" px="8px" py="3px" borderRadius="full" ml="8px">
                    <Text fontSize="11px" fontWeight="700" color="green.700">
                      Done
                    </Text>
                  </Box>
                )}
                {!trip.completed && (
                  <Box bg="orange.100" px="8px" py="3px" borderRadius="full" ml="8px">
                    <Text fontSize="11px" fontWeight="700" color="orange.700">
                      Archived
                    </Text>
                  </Box>
                )}
              </HStack>

              <HStack mt="12px" space="4" flexWrap="wrap">
                <VStack>
                  <Text fontSize="11px" color="gray.600">Distance</Text>
                  <Text fontSize="14px" fontWeight="700" color="primary.400">
                    {trip.distance ? prettifyNum(trip.distance.toFixed(1)) : '0'} km
                  </Text>
                </VStack>
                <VStack>
                  <Text fontSize="11px" color="gray.600">Steps</Text>
                  <Text fontSize="14px" fontWeight="700" color="primary.400">
                    {prettifyNum(trip.steps || 0)}
                  </Text>
                </VStack>
                <VStack>
                  <Text fontSize="11px" color="gray.600">Walked</Text>
                  <Text fontSize="14px" fontWeight="700" color="primary.400">
                    {stepsToDistance(trip.steps)} km
                  </Text>
                </VStack>
                <VStack>
                  <Text fontSize="11px" color="gray.600">Duration</Text>
                  <Text fontSize="14px" fontWeight="700" color="primary.400">
                    {formatDuration(trip.startedTime, trip.completedDate)}
                  </Text>
                </VStack>
              </HStack>

              <HStack mt="8px" space="3">
                {trip.badges > 0 && (
                  <Text fontSize="12px" color="gray.500">
                    {'🏛️'} {trip.badges}/{trip.totalBadges} landmarks
                  </Text>
                )}
                {trip.cities > 0 && (
                  <Text fontSize="12px" color="gray.500">
                    {'🏙️'} {trip.cities} cities
                  </Text>
                )}
              </HStack>

              <Pressable
                mt="8px"
                alignSelf="flex-end"
                onPress={() => handleDelete(trip.id)}
                accessibilityLabel="Remove this trip from history"
                accessibilityRole="button"
              >
                <Text fontSize="12px" color="red.700" fontWeight="500">
                  Remove
                </Text>
              </Pressable>
            </Box>
          ))}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  )
}

export default TripHistory
