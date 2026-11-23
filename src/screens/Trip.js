import React, { useMemo, useRef, useState } from 'react'
import { Alert, SafeAreaView, StatusBar } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Flex, Pressable, ScrollView, Text, VStack, useToast } from 'native-base'
import BackSVG from '../assets/icons/back.svg'
import { buildCuratedTrip, VIRTUAL_ROUTES } from '../data/curatedRoutes'
import { getCurrentAccountId, getUserSettings, setUserSettings } from '../services/database'
import { hasActiveTrip } from '../services/helpers'
import { archiveCurrentTrip } from '../services/tripHistory'

const Trip = () => {
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const saving = useRef(false)
  const [selected, setSelected] = useState(null)
  const { data: currentTrip, isLoading } = useQuery(['settings'], getUserSettings)
  const trips = useMemo(() => VIRTUAL_ROUTES.map(buildCuratedTrip), [])

  const startTrip = async (trip) => {
    const uid = getCurrentAccountId()
    if (!uid || saving.current) return
    saving.current = true
    setSelected(trip.curatedRouteId)

    try {
      const previous = await getUserSettings(uid)
      if (getCurrentAccountId() !== uid) return
      if (hasActiveTrip(previous)) await archiveCurrentTrip(previous, uid)
      if (getCurrentAccountId() !== uid) return

      const startedTime = new Date().toISOString()
      await setUserSettings({
        ...trip,
        tripId: startedTime,
        startedTime,
        health: previous.health,
        healthSetupCompleted: previous.healthSetupCompleted,
        steps: 0,
        cities: []
      }, uid)

      if (getCurrentAccountId() !== uid) return
      await Promise.all([
        queryClient.invalidateQueries(['settings']),
        queryClient.invalidateQueries(['stats'])
      ])
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
    } catch {
      toast.show({ status: 'error', description: 'Could not start your trip. Please try again.' })
    } finally {
      saving.current = false
      setSelected(null)
    }
  }

  const chooseTrip = (trip) => {
    if (!hasActiveTrip(currentTrip) || currentTrip.completed) {
      startTrip(trip)
      return
    }
    Alert.alert(
      'Start a new route?',
      'Your current route will move to Trip History. Your new route starts at zero steps.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start new route', onPress: () => startTrip(trip) }
      ]
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F3F6' }}>
      <StatusBar barStyle="dark-content" />
      {navigation.canGoBack() && (
        <Pressable onPress={navigation.goBack} p="3" alignSelf="flex-start" accessibilityRole="button" accessibilityLabel="Go back">
          <BackSVG />
        </Pressable>
      )}
      <ScrollView flex="1" px="20px" contentContainerStyle={{ paddingBottom: 32 }}>
        <Text variant="title" mt="24px" accessibilityRole="header">Choose a virtual route</Text>
        <Text variant="subtitle" mt="2" mb="5">
          Walk wherever you like. Your steps move you between landmarks on the route.
        </Text>
        <VStack space="3">
          {trips.map((trip) => (
            <Flex key={trip.curatedRouteId} bg="white" borderRadius="16px" p="4">
              <Flex bg="primary.400" borderRadius="12px" p="4">
                <Text color="secondary.400">{trip.badges[0].vicinity} · {trip.distance.toFixed(1)} km</Text>
                <Text mt="1" color="white" fontSize="20px" fontWeight="700" accessibilityRole="header">{trip.title}</Text>
              </Flex>
              <Text mt="2" mb="3" color="gray.600">
                {trip.starting.title} → {trip.badges.map(({ name }) => name).join(' → ')}
              </Text>
              <Button
                variant="primary"
                size="lg"
                isLoading={selected === trip.curatedRouteId}
                isDisabled={isLoading || !!selected}
                onPress={() => chooseTrip(trip)}
                accessibilityLabel={`Start ${trip.title} at zero steps`}
              >
                Start route
              </Button>
            </Flex>
          ))}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Trip
