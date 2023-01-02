import React, { useEffect } from 'react'
import TabScreen from '../components/TabScreen'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { hasNotch } from 'react-native-device-info'
import { Flex, Box, Pressable, Text } from 'native-base'
import mapStyle from '../theme/mapStyle.json'
import DistanceIcon from '../assets/icons/distance.svg'
import RightIcon from '../assets/icons/arrow-right.svg'
import MarkerIcon from '../assets/icons/marker.svg'
import PinIcon from '../assets/icons/pin.svg'
import { useQuery } from '@tanstack/react-query'
import { getUserSettings, setUserSettings } from '../services/database'

const Map = () => {
  const { data: settings } = useQuery(['settings'], getUserSettings)
  const { starting, destination, progress, distance } = settings || {}

  // useEffect(() => {
  //   setUserSettings({
  //     starting: {
  //       title: 'Los Angeles, California, USA',
  //       coordinate: {
  //         latitude: 34.0523003,
  //         longitude: -118.2787043
  //       }
  //     },
  //     destination: {
  //       title: 'San Francisco, California, USA',
  //       coordinate: {
  //         latitude: 37.7577627,
  //         longitude: -122.4726194
  //       }
  //     },
  //     progress: 280,
  //     distance: 420
  //   }).then(() => null)
  // }, [])

  const isIphoneX = hasNotch()

  return (
    <TabScreen>
      <MapView
        customMapStyle={mapStyle}
        mapPadding={{ bottom: isIphoneX ? 70 : 50, left: 16, right: 16 }}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 36.2044527,
          longitude: -120.0665638,
          latitudeDelta: 9.4,
          longitudeDelta: 0.2
        }}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'F3F3F6'
        }}
      >
        {!!starting && (
          <Marker
            title="Starting"
            tracksViewChanges={false}
            coordinate={starting?.coordinate}
            centerOffset={{ x: 0.5, y: 0.5 }}
          >
            <MarkerIcon width={32} height={32} />
          </Marker>
        )}
        {!!destination && (
          <Marker
            title="Destination"
            tracksViewChanges={false}
            coordinate={destination?.coordinate}
            centerOffset={{ x: 0.5, y: 0.5 }}
          >
            <PinIcon width={32} height={32} />
          </Marker>
        )}
      </MapView>
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        height="44px"
        bg="#EAEAEA"
      ></Box>
      <Pressable
        _pressed={{ opacity: 0.9 }}
        bg="primary.400"
        h="65px"
        pl="20px"
        pr="10px"
        left="20px"
        right="20px"
        borderRadius="16px"
        position="absolute"
        top={isIphoneX ? '44px' : '20px'}
      >
        <Flex flex="1" direction="row" align="center">
          <DistanceIcon />
          <Flex flex="1" align="center" pl="12px" pr="4px">
            <Text variant="from" numberOfLines={1}>
              {starting?.title || ''}
            </Text>
            <Text variant="to" numberOfLines={1}>
              {destination?.title || ''}
            </Text>
          </Flex>
          <RightIcon width={36} height={36} />
        </Flex>
      </Pressable>
    </TabScreen>
  )
}

export default Map
