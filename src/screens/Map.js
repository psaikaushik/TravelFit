import React from 'react'
import TabScreen from '../components/TabScreen'
import MapView, {
  Circle,
  Marker,
  Polyline,
  PROVIDER_GOOGLE
} from 'react-native-maps'
import { hasNotch } from 'react-native-device-info'
import { useNavigation } from '@react-navigation/native'
import { Avatar, Flex, Box, Pressable, Text } from 'native-base'
import mapStyle from '../theme/mapStyle.json'
import DistanceIcon from '../assets/icons/distance.svg'
import RightIcon from '../assets/icons/arrow-right.svg'
import PinIcon from '../assets/icons/pin.svg'
import OriginIcon from '../assets/icons/origin.svg'
import MarkIcon from '../assets/icons/mark.svg'
import * as PlaceNavigation from '../routes/PlaceNavigation'
import { useQuery } from '@tanstack/react-query'
import { getUserSettings } from '../services/database'
import {
  calcProgress,
  getDestinationStep,
  getRadius,
  getZoom,
  prettifyNum
} from '../services/helpers'
import useBackgroundTasks from '../services/background'

const Map = () => {
  const { navigate } = useNavigation()
  const backgroundTasks = useBackgroundTasks()
  const { data: settings } = useQuery(['settings'], getUserSettings)
  const { starting, destination, route, breakPoints, badges, steps, distance } =
    settings || {}
  const routeCenter = !!route ? route[Math.ceil(route.length / 2)] : null
  const progressIdx = Math.round(
    (calcProgress(steps, distance) / 100) * route?.length
  )
  const progressRoute = getDestinationStep(progressIdx, route)
  const destinationPoint =
    !!progressRoute && progressRoute.length > 0
      ? progressRoute[progressRoute.length - 1]
      : !!route
      ? route[0]
      : null
  const { latitudeDelta, longitudeDelta } = getZoom(distance)

  const handlePressCity = (index) => {
    const badge = badges[index]
    PlaceNavigation.close()
    PlaceNavigation.navigate('PlaceModal', { badge })
  }

  const handleTrip = () => {
    PlaceNavigation.close()
    navigate('Trip', { fromMap: true })
  }

  const isIphoneX = hasNotch()

  if (!destinationPoint) return <TabScreen />

  return (
    <TabScreen>
      <MapView
        customMapStyle={mapStyle}
        mapPadding={{ bottom: isIphoneX ? 70 : 50, left: 16, right: 16 }}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: destinationPoint.latitude,
          longitude: destinationPoint.longitude,
          latitudeDelta,
          longitudeDelta
        }}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#F3F3F6'
        }}
      >
        {!!route && (
          <Polyline coordinates={route} strokeWidth={5} strokeColor="#AAA" />
        )}
        {!!progressRoute && (
          <Polyline
            coordinates={progressRoute}
            strokeWidth={5}
            strokeColor="#617921"
          />
        )}
        {!!starting && (
          <Marker
            title="Starting"
            tracksViewChanges={true}
            coordinate={starting?.coordinate}
            centerOffset={{ x: 0.5, y: 0.5 }}
          >
            <OriginIcon width={15} height={15} />
          </Marker>
        )}
        {!!destination && (
          <Marker
            title="Destination"
            tracksViewChanges={true}
            coordinate={destination?.coordinate}
            centerOffset={{ x: 0.5, y: 0.5 }}
          >
            <PinIcon width={32} height={32} />
          </Marker>
        )}
        {(breakPoints || []).map((item) => (
          <Circle
            key={`${item.latitude}-${item.longitude}`}
            center={item}
            radius={getRadius(distance) * 1000}
            strokeColor="#61792140"
            fillColor="#61792115"
          />
        ))}
        {(breakPoints || []).map((item, index) => {
          const badge = badges[index]
          if (!badge || !badge.photos) {
            return null
          }
          return (
            <Marker
              key={`${item.latitude}-${item.longitude}`}
              title={item.name}
              coordinate={{
                latitude: item.latitude,
                longitude: item.longitude
              }}
              onPress={() => handlePressCity(index)}
              centerOffset={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={true}
            >
              <Flex>
                <Flex position="absolute" bottom="0" left="7px">
                  <MarkIcon />
                </Flex>
                <Avatar
                  w="40px"
                  h="40px"
                  source={{
                    uri: `https://maps.googleapis.com/maps/api/place/photo?photoreference=${badge.photos[0].photo_reference}&sensor=false&maxheight=40&maxwidth=40&key=AIzaSyCe80iwSU9qzr-p5Zj8jQVfcjZFa9k_zHs`
                  }}
                  mb="6px"
                  bg="#CCC"
                  borderWidth="3px"
                  borderColor="white"
                />
              </Flex>
            </Marker>
          )
        })}
        {!!routeCenter && (
          <Marker
            zIndex={9999}
            tracksViewChanges={true}
            coordinate={routeCenter}
            centerOffset={{ x: 0.5, y: 0.5 }}
          >
            <Flex
              bg="white"
              px="6px"
              py="5px"
              ml="60px"
              align="center"
              justify="center"
              borderRadius="30px"
              borderWidth="1px"
              borderColor="#888"
            >
              <Text variant="distance">
                {prettifyNum(distance.toFixed(2))} KM
              </Text>
            </Flex>
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
        onPress={handleTrip}
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
