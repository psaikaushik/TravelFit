import React, { useEffect, useState } from 'react'
import TabScreen from '../components/TabScreen'
import MapView, {
  Circle,
  Marker,
  Polyline,
  PROVIDER_GOOGLE
} from 'react-native-maps'
// import MapPolyline from '@mapbox/polyline'
import { hasNotch } from 'react-native-device-info'
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
  prettifyNum
} from '../services/helpers'

const Map = () => {
  const [selectedPlace, setSelectedPlace] = useState(null)
  const { data: settings } = useQuery(['settings'], getUserSettings)
  const { starting, destination, route, breakPoints, badges, steps, distance } =
    settings || {}
  const routeCenter = !!route ? route[Math.ceil(route.length / 2)] : null
  const progressIdx = Math.round(
    (calcProgress(steps, distance) / 100) * route?.length
  ) // 222280
  const progressRoute = getDestinationStep(progressIdx, route)
  const destinationPoint =
    !!progressRoute && progressRoute.length > 0
      ? progressRoute[progressRoute.length - 1]
      : null

  const handlePressCity = (index) => {
    const badge = badges[index]
    PlaceNavigation.close()
    setSelectedPlace(badge)
    PlaceNavigation.navigate('PlaceModal', { badge })
  }

  useEffect(() => {
    if (!route) return
    if (!destinationPoint) return

    // Everytime Route Changes
    //   Create Break points inside route
    //   Get Nearby Places in break points

    // Everytime Progress Changes
    //   Calculate distance from progress to each break point
    //   Check if city is new then add city badge
    //   Check if distance progressed is in new stage then add new milestone

    // getUserSettings().then(async (userSettings) => {
    //   const cities = userSettings.cities || []
    //   console.log('cities', cities)
    //   cities.push('Castaic')
    //   await setUserSettings({
    //     ...userSettings,
    //     cities
    //   })
    // })

    // try {
    //   getLocationDetails(destinationPoint).then(async (data) => {
    //     const { results } = data || {}
    //     // console.log('results', JSON.stringify(results))
    //     let city = null
    //     for (let r = 0; r < (results || []).length; r++) {
    //       const { address_components } = results[r]
    //       for (let t = 0; t < address_components.length; t++) {
    //         const address = address_components[t]
    //         const types = address.types || []
    //         if (types.find((x) => x === 'locality')) {
    //           city = { name: address.long_name }
    //         }
    //         if (
    //           !city?.name &&
    //           types.find((x) => x === 'administrative_area_level_2')
    //         ) {
    //           city = { name: address.long_name }
    //         }
    //         if (types.find((x) => x === 'administrative_area_level_1')) {
    //           city.state = address.long_name
    //         }
    //         if (types.find((x) => x === 'country')) {
    //           city.country = address.short_name
    //         }
    //       }
    //       if (!!city) break
    //     }
    //
    //     if (!city?.name) return
    //     const cityName = `${city.name}, ${city.state || ''}, ${
    //       city.country || ''
    //     }`
    //     const details = await getCityDetails(city.name)
    //     const prediction =
    //       (details?.predictions || []).length > 0
    //         ? details.predictions[0]
    //         : null
    //     if (!prediction) return
    //     const place = await getPlaceDetails(prediction.place_id)
    //
    //     const userSettings = await getUserSettings()
    //     const cities = []
    //     // const { cities } = userSettings || {}
    //     if (!!city && !cities.find((x) => x.place_id === prediction.place_id)) {
    //       cities.push({
    //         place_id: prediction.place_id,
    //         name: cityName,
    //         photos: place.result.photos || []
    //       })
    //       await setUserSettings({
    //         ...userSettings,
    //         cities
    //       })
    //     }
    //   })
    // } catch (error) {
    //   console.log(error.code, error.message)
    // }

    // getPlaces(destination.coordinate, steps, route, badges, distance).then(
    //   ({ breakPoints, places }) => {
    //     setBreakPoints(breakPoints)
    //     getUserSettings().then(async (userSettings) => {
    //       await setUserSettings({
    //         ...userSettings,
    //         badges: places,
    //         breakPoints: breakPoints
    //       })
    //     })
    //   }
    // )

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
            radius={20000}
            strokeColor="#61792140"
            fillColor="#61792115"
          />
        ))}
        {(breakPoints || []).map((item, index) => {
          const badge = badges[index]
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
        {/*{(breakPoints || []).map((item, index) => (*/}
        {/*  <Marker*/}
        {/*    key={`${item.place_id}`}*/}
        {/*    title={item.name}*/}
        {/*    coordinate={{*/}
        {/*      latitude: item.latitude,*/}
        {/*      longitude: item.longitude*/}
        {/*    }}*/}
        {/*    centerOffset={{ x: 0.5, y: 0.5 }}*/}
        {/*    tracksViewChanges={false}*/}
        {/*  />*/}
        {/*))}*/}
        {/*{(badges || []).map((item) => (*/}
        {/*  <Marker*/}
        {/*    key={`${item.place_id}`}*/}
        {/*    title={item.name}*/}
        {/*    coordinate={{*/}
        {/*      latitude: item.geometry.location.lat,*/}
        {/*      longitude: item.geometry.location.lng*/}
        {/*    }}*/}
        {/*  />*/}
        {/*))}*/}
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
