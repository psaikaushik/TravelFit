import React, { useMemo } from 'react'
import { Platform } from 'react-native'
import MapView, { Marker, Polyline } from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Box, Button, Flex, HStack, Spinner, Text } from 'native-base'
import { useQuery } from '@tanstack/react-query'
import TabScreen from '../components/TabScreen'
import MarkIcon from '../assets/icons/mark.svg'
import * as PlaceNavigation from '../routes/PlaceNavigation'
import { getUserSettings } from '../services/database'
import { calcProgress, calcSteps, getDestinationStep, getTripProgressIndex, hasActiveTrip } from '../services/helpers'
import useBackgroundTasks from '../services/background'

const getRegion = (route) => {
  const latitudes = route.map(({ latitude }) => latitude)
  const longitudes = route.map(({ longitude }) => longitude)
  const south = Math.min(...latitudes)
  const north = Math.max(...latitudes)
  const west = Math.min(...longitudes)
  const east = Math.max(...longitudes)
  return {
    latitude: (south + north) / 2,
    longitude: (west + east) / 2,
    latitudeDelta: Math.max((north - south) * 1.65, 0.01),
    longitudeDelta: Math.max((east - west) * 1.65, 0.01)
  }
}

const syncLabels = {
  syncing: 'Syncing steps…',
  ready: 'Steps synced',
  empty: 'No step samples available. Check TravelFit access in the Health app.',
  unavailable: 'Could not sync steps. Try refreshing.',
  off: 'Step sync is off.',
  complete: 'Route complete'
}

const Map = () => {
  const { navigate } = useNavigation()
  const insets = useSafeAreaInsets()
  const { status, sync } = useBackgroundTasks()
  const { data: settings, isLoading } = useQuery(['settings'], getUserSettings)
  const { route, starting, badges, steps = 0, distance, title } = settings || {}
  const active = hasActiveTrip(settings)
  const initialRegion = useMemo(() => active ? getRegion(route) : null, [active, route])

  if (!active) {
    return (
      <TabScreen>
        <Flex flex="1" px="5" align="center" justify="center" bg="offWhite">
          {isLoading ? (
            <Spinner accessibilityLabel="Loading your route" />
          ) : (
            <>
              <Text variant="title" accessibilityRole="header">Choose your first route</Text>
              <Button mt="4" variant="primary" onPress={() => navigate('Trip')}>Browse routes</Button>
            </>
          )}
        </Flex>
      </TabScreen>
    )
  }

  const position = getTripProgressIndex(steps, distance, route)
  const walkedRoute = getDestinationStep(position, route)
  const traveled = Math.min(Number(calcSteps(steps)), distance)
  const progress = Math.floor(calcProgress(steps, distance))
  const syncLabel = Platform.OS === 'ios' ? syncLabels[status] : 'Step sync is available on iOS.'

  return (
    <TabScreen>
      <MapView
        key={settings.tripId}
        initialRegion={initialRegion}
        mapPadding={{ top: insets.top + 144, bottom: insets.bottom + 70, left: 20, right: 20 }}
        style={{ flex: 1 }}
        accessibilityLabel="Map of your virtual route"
        testID="trip-map"
      >
        <Polyline coordinates={route} strokeWidth={5} strokeColor="#6D7571" />
        {walkedRoute?.length > 1 && (
          <Polyline coordinates={walkedRoute} strokeWidth={6} strokeColor="#617921" />
        )}
        <Marker title={starting.title} coordinate={route[0]} pinColor="#6D7571" />
        {badges.map((badge) => (
          <Marker
            key={badge.place_id}
            coordinate={badge.coordinate}
            title={badge.name}
            pinColor={badge.progress === 100 ? '#617921' : '#6D7571'}
            onCalloutPress={() => {
              PlaceNavigation.close()
              PlaceNavigation.navigate('PlaceModal', { badge })
            }}
          />
        ))}
        <Marker coordinate={route[position]} title="Your virtual position" zIndex={2}>
          <MarkIcon width={24} height={28} />
        </Marker>
      </MapView>
      <Box position="absolute" top={insets.top + 8} left="20px" right="20px" p="3" bg="white" borderRadius="16px" shadow="2">
        <HStack justifyContent="space-between" space="3" alignItems="center">
          <Box flex="1">
            <Text fontWeight="700" fontSize="18px" accessibilityRole="header" testID="trip-map-title">{title}</Text>
            <Text color="gray.700" fontSize="13px" testID="trip-map-progress">
              {traveled.toFixed(2)} / {distance.toFixed(2)} km · {progress}% · {steps.toLocaleString()} steps
            </Text>
          </Box>
          <Button
            variant="outline"
            size="sm"
            accessibilityLabel="Change virtual route"
            testID="trip-map-routes"
            onPress={() => navigate('Trip')}
          >
            {status === 'complete' ? 'Next route' : 'Routes'}
          </Button>
        </HStack>
        <HStack justifyContent="space-between" space="3" alignItems="center" mt="2">
          <Text flex="1" color="gray.700" fontSize="13px" accessibilityLiveRegion="polite" testID="trip-map-status">{syncLabel}</Text>
          {Platform.OS === 'ios' && (status === 'off' ? (
            <Button size="sm" variant="ghost" onPress={() => navigate('AppleHealth')} testID="trip-map-connect-health">Connect Health</Button>
          ) : status !== 'complete' && (
            <Button size="sm" variant="ghost" onPress={sync} isLoading={status === 'syncing'}>Refresh</Button>
          ))}
        </HStack>
      </Box>
    </TabScreen>
  )
}

export default Map
