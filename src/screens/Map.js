import React, { useEffect, useState } from 'react'
import TabScreen from '../components/TabScreen'
import MapView, {
  Circle,
  Marker,
  Polyline,
  PROVIDER_GOOGLE
} from 'react-native-maps'
import MapPolyline from '@mapbox/polyline'
import { hasNotch } from 'react-native-device-info'
import { Flex, Box, Pressable, Text } from 'native-base'
import mapStyle from '../theme/mapStyle.json'
import DistanceIcon from '../assets/icons/distance.svg'
import RightIcon from '../assets/icons/arrow-right.svg'
import PinIcon from '../assets/icons/pin.svg'
import OriginIcon from '../assets/icons/origin.svg'
import { useQuery } from '@tanstack/react-query'
import { getUserSettings, setUserSettings } from '../services/database'
import { getPlaces } from '../services/maps'
import {
  calcProgress,
  getDestinationStep,
  getPolygonPoints,
  prettifyNum
} from '../services/helpers'

const Map = () => {
  const [badges, setBadges] = useState([])
  const [breakPoints, setBreakPoints] = useState([])
  const { data: settings } = useQuery(['settings'], getUserSettings)
  const { starting, destination, route, polygon, steps, distance } =
    settings || {}
  const routeCenter = !!route ? route[Math.ceil(route.length / 2)] : null
  const progressIdx = Math.round(
    (calcProgress(steps, distance) / 100).toFixed(1) * route?.length
  )
  const progressRoute = getDestinationStep(progressIdx, route)

  // console.log(
  //   'route',
  //   distance,
  //   route?.length,
  //   'steps',
  //   calcProgress(distance).toFixed(1),
  //   progressIdx,
  //   currentStep
  // )

  useEffect(() => {
    if (!route) return
    getPlaces(route, distance).then(({ breakPoints, places }) => {
      setBreakPoints(breakPoints)
      setBadges(places)
    })
    // getRoute(starting.coordinate, destination.coordinate).then(async (res) => {
    //   if (!res.routes || res.routes.length === 0) return
    //   let pts = MapPolyline.decode(res.routes[0].overview_polyline.points)
    //   const polygonPoints = getPolygonPoints(pts)
    //   console.log('route', polygonPoints)
    //   const userSettings = await getUserSettings()
    //   await setUserSettings({
    //     ...userSettings,
    //     polygon: polygonPoints,
    //     bounds: res.routes[0].bounds,
    //     duration: res.routes[0].legs[0].duration.value,
    //     distance: res.routes[0].legs[0].distance.value / 1000,
    //     route: pts.map((point) => ({ latitude: point[0], longitude: point[1] }))
    //   })
    // })
    // setUserSettings({
    //   starting: {
    //     title: 'Los Angeles, California, USA',
    //     coordinate: {
    //       latitude: 34.0523003,
    //       longitude: -118.2787043
    //     }
    //   },
    //   destination: {
    //     title: 'San Francisco, California, USA',
    //     coordinate: {
    //       latitude: 37.7577627,
    //       longitude: -122.4726194
    //     }
    //   },
    //   steps: 122280,
    //   distance: 420,
    //   route
    // }).then(() => null)
  }, [route])

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
        {/*{!!polygon && (*/}
        {/*  <Polyline*/}
        {/*    coordinates={polygon}*/}
        {/*    strokeWidth={60}*/}
        {/*    strokeColor="#61792133"*/}
        {/*  />*/}
        {/*)}*/}
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
        {/*{!!starting && !!destination && (*/}
        {/*  <MapViewDirections*/}
        {/*    origin={starting.coordinate}*/}
        {/*    destination={destination.coordinate}*/}
        {/*    apikey="AIzaSyCe80iwSU9qzr-p5Zj8jQVfcjZFa9k_zHs"*/}
        {/*    mode="WALKING"*/}
        {/*    strokeWidth={3}*/}
        {/*    strokeColor="#999"*/}
        {/*  />*/}
        {/*)}*/}
        {/*{!!starting && !!destination && (*/}
        {/*  <MapViewDirections*/}
        {/*    origin={starting.coordinate}*/}
        {/*    destination={{ latitude: 35.093897, longitude: -119.302273 }}*/}
        {/*    apikey="AIzaSyCe80iwSU9qzr-p5Zj8jQVfcjZFa9k_zHs"*/}
        {/*    mode="WALKING"*/}
        {/*    strokeWidth={3}*/}
        {/*    strokeColor="#1A2225"*/}
        {/*  />*/}
        {/*)}*/}
        {!!starting && (
          <Marker
            title="Starting"
            tracksViewChanges={false}
            coordinate={starting?.coordinate}
            centerOffset={{ x: 0.5, y: 0.5 }}
          >
            <OriginIcon width={15} height={15} />
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
        {!!routeCenter && (
          <Marker
            title="150 KM"
            tracksViewChanges={false}
            coordinate={routeCenter}
            centerOffset={{ x: 0.5, y: 0.5 }}
          >
            <Flex
              bg="white"
              px="6px"
              py="5px"
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
        {breakPoints.map((item) => (
          <Circle
            key={`${item.latitude}-${item.longitude}`}
            center={item}
            radius={50000}
            fillColor="#61792140"
          />
        ))}
        {badges.map((item) => (
          <Marker
            key={`${item.place_id}`}
            coordinate={{
              latitude: item.geometry.location.lat,
              longitude: item.geometry.location.lng
            }}
          />
        ))}
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
