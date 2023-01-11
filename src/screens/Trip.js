import React, { useEffect, useState } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import {
  Text,
  Button,
  useToast,
  Container,
  Flex,
  WarningOutlineIcon,
  FormControl
} from 'native-base'
import { SafeAreaView, StatusBar } from 'react-native'
import TripSVG from '../assets/icons/trip.svg'
import { useForm } from 'react-hook-form'
import SearchableDropdown from '../components/SearchableDropdown'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import {
  getCityDetails,
  getPlaceDetails,
  getPlaces,
  getRoute
} from '../services/maps'
import { getUserSettings, setUserSettings } from '../services/database'
import MapPolyline from '@mapbox/polyline'
import {
  calcProgress,
  checkCity,
  getDestinationStep
} from '../services/helpers'
import { useQueryClient } from '@tanstack/react-query'

const Trip = ({ fromMap }) => {
  let SEARCHING = false
  let SHOULD_SEARCH = null
  const [addExtra, setAddExtra] = useState(-1)
  const [originText, setOriginText] = useState(null)
  const [originItems, setOriginItems] = useState([
    { id: 'ChIJE9on3F3HwoAR9AhGJW_fL-I', name: 'Los Angeles, CA, USA' },
    { id: 'ChIJdd4hrwug2EcRmSrV3Vo6llI', name: 'London, UK' }
  ])
  const [destinationText, setDestinationText] = useState(null)
  const [destinationItems, setDestinationItems] = useState([
    { id: 'ChIJIQBpAG2ahYAR_6128GcTUEo', name: 'San Francisco, CA, USA' },
    { id: 'ChIJOwg_06VPwokRYv534QaPC8g', name: 'New York, NY, USA' }
  ])
  const queryClient = useQueryClient()
  const isFocused = useIsFocused()
  const { reset } = useNavigation()
  const toast = useToast()
  const {
    getValues,
    setValue,
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm()

  const origin = register('origin', { required: true })
  const destination = register('destination', { required: true })

  const setOptions = (list, text, type) => {
    if (type === 'origin') {
      if (originText !== text) return
      setOriginItems(list)
    } else {
      if (destinationText !== text) return
      setDestinationItems(list)
    }
  }

  const handleTextChange = async (text, type) => {
    if (SEARCHING) {
      SHOULD_SEARCH = text
      return
    }
    SEARCHING = true
    SHOULD_SEARCH = null

    const searchText = (text || '').trim().toLowerCase()
    if (!!searchText && searchText.length > 0) {
      const results = await getCityDetails(text)
      const { predictions } = results || {}
      console.log('results', text, predictions.length)
      const options = predictions.slice(0, 3).map((x) => ({
        id: x.place_id,
        name: x.description
      }))
      setOptions(options, text, type)
    } else {
      setOptions([], text, type)
    }

    if (SHOULD_SEARCH && SHOULD_SEARCH !== text) {
      SEARCHING = false
      handleTextChange(SHOULD_SEARCH, type).then(() => null)
    } else {
      SEARCHING = false
    }
  }

  const handleSave = async () => {
    const { origin, destination } = getValues()
    const userSettings = await getUserSettings()
    const { steps } = userSettings || {}

    // Get Location details of origin and destination
    const promises = []
    promises.push(getPlaceDetails(origin.id, 'geometry'))
    promises.push(getPlaceDetails(destination.id, 'geometry'))
    const [originRes, destinationRes] = await Promise.all(promises)
    const originLocation = originRes.result?.geometry?.location
    const destinationLocation = destinationRes.result?.geometry?.location
    if (!originLocation) {
      toast.show({
        status: 'error',
        description: 'Could not fetch origin details'
      })
      return
    }
    if (!destinationLocation) {
      toast.show({
        status: 'error',
        description: 'Could not fetch origin details'
      })
      return
    }

    // Fetch Route between origin and destination
    const res = await getRoute(
      { latitude: originLocation.lat, longitude: originLocation.lng },
      { latitude: destinationLocation.lat, longitude: destinationLocation.lng }
    )
    if (!res.routes || res.routes.length === 0) {
      toast.show({
        status: 'error',
        description:
          'Could not find a valid route between both cities. Try again with different cities'
      })
      return
    }
    const routeDetails = res.routes[0]
    const pts = MapPolyline.decode(routeDetails.overview_polyline.points)
    const route = pts.map((point) => ({
      latitude: point[0],
      longitude: point[1]
    }))
    const distance = routeDetails.legs[0].distance.value / 1000
    const duration = routeDetails.legs[0].duration.value

    console.log('route', route.length)

    // Create Break points and Nearby Places in each break point
    const { breakPoints, places } = await getPlaces(
      steps || 0,
      route,
      [],
      distance
    )

    console.log('getPlaces', places.length)

    const progressIdx = Math.round(
      (calcProgress(steps, distance) / 100) * route?.length
    )
    const progressRoute = getDestinationStep(progressIdx, route)
    const destinationPoint =
      !!progressRoute && progressRoute.length > 0
        ? progressRoute[progressRoute.length - 1]
        : route[0]

    //  Check if city is new then add city badge
    const cities = await checkCity(destinationPoint, [])

    console.log('cities', cities.length)

    await setUserSettings({
      ...userSettings,
      starting: {
        title: origin.name,
        coordinate: {
          latitude: originLocation.lat,
          longitude: originLocation.lng
        }
      },
      destination: {
        title: destination.name,
        coordinate: {
          latitude: destinationLocation.lat,
          longitude: destinationLocation.lng
        }
      },
      bounds: routeDetails.bounds,
      duration,
      distance,
      route,
      breakPoints,
      cities,
      badges: places
    })
    await queryClient.invalidateQueries(['settings'])
    await queryClient.invalidateQueries(['stats'])

    reset({
      index: 0,
      routes: [{ name: 'Main' }]
    })
  }

  useEffect(() => {
    if (isFocused) {
      StatusBar.setBarStyle('dark-content', true)
    }
  }, [isFocused])

  useEffect(() => {
    if (originText !== null) {
      handleTextChange(originText, 'origin').then(() => null)
    }
  }, [originText])

  useEffect(() => {
    if (destinationText !== null) {
      handleTextChange(destinationText, 'destination').then(() => null)
    }
  }, [destinationText])

  // useEffect(() => {
  //   if (addExtra !== -1) {
  //     console.log('addExtra', addExtra)
  //     if (addExtra === 1) {
  //       setTimeout(() => {
  //         this.flatListRef.scrollTo({ y: 30 })
  //       }, 4000)
  //     } else if (addExtra === 1) {
  //       setTimeout(() => {
  //         this.flatListRef.scrollTo({ y: 120 })
  //       }, 4000)
  //     } else {
  //       // setTimeout(() => {
  //       //   this.flatListRef.scrollTo({ y: 0 })
  //       // }, 1000)
  //     }
  //   }
  // }, [addExtra])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <KeyboardAwareScrollView
        innerRef={(ref) => (this.flatListRef = ref)}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps={'handled'}
        automaticallyAdjustContentInsets={false}
        scrollEventThrottle={200}
      >
        <Container px="20px" mt="12px" w="100%" minW="100%" flexGrow="1">
          <Flex flexGrow="1" width="100%">
            <Flex align="center" width="100%">
              <TripSVG />
            </Flex>
            <Text variant="title" mt="30px">
              Setup your trip
            </Text>
            <Text variant="subtitle" mt="10px">
              Choose the origin and destination of your virtual trip
            </Text>
            <SearchableDropdown
              key="origin"
              items={originItems}
              resetValue={false}
              onItemSelect={(item) => setValue('origin', item)}
              itemsContainerStyle={{
                minHeight: 30,
                maxHeight: 140,
                marginTop: -13,
                paddingVertical: 6,
                backgroundColor: 'white',
                borderWidth: 1,
                borderColor: '#999',
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16
              }}
              itemTextStyle={{ color: '#1A2225' }}
              itemStyle={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderColor: '#bbb'
              }}
              textInputProps={{
                placeholder: 'Origin',
                placeholderTextColor: '#999',
                underlineColorAndroid: 'transparent',
                style: {
                  height: 60,
                  marginTop: 30,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: '#999',
                  backgroundColor: '#FAFAFA',
                  fontSize: 16
                },
                onTextChange: (text) => setOriginText(text),
                onFocus: () => setAddExtra(1),
                onBlur: () => setAddExtra(0)
              }}
            />
            {!!errors?.origin && (
              <FormControl isInvalid={true}>
                <FormControl.ErrorMessage
                  leftIcon={<WarningOutlineIcon size="xs" />}
                >
                  {errors.origin.type === 'required' && 'Required field'}
                  {errors.origin.type !== 'required' && errors.origin.message}
                </FormControl.ErrorMessage>
              </FormControl>
            )}
            <SearchableDropdown
              key="destination"
              items={destinationItems}
              resetValue={false}
              onItemSelect={(item) => setValue('destination', item)}
              itemsContainerStyle={{
                minHeight: 30,
                maxHeight: 140,
                marginTop: -13,
                paddingVertical: 6,
                backgroundColor: 'white',
                borderWidth: 1,
                borderColor: '#999',
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16
              }}
              itemTextStyle={{ color: '#1A2225' }}
              itemStyle={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderColor: '#bbb'
              }}
              textInputProps={{
                placeholder: 'Destination',
                placeholderTextColor: '#999',
                underlineColorAndroid: 'transparent',
                style: {
                  height: 60,
                  marginTop: 30,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: '#999',
                  backgroundColor: '#FAFAFA',
                  fontSize: 16
                },
                onTextChange: (text) => setDestinationText(text),
                onFocus: () => setAddExtra(2),
                onBlur: () => setAddExtra(0)
              }}
            />
            {!!errors?.destination && (
              <FormControl isInvalid={true}>
                <FormControl.ErrorMessage
                  leftIcon={<WarningOutlineIcon size="xs" />}
                >
                  {errors.destination.type === 'required' && 'Required field'}
                  {errors.destination.type !== 'required' &&
                    errors.destination.message}
                </FormControl.ErrorMessage>
              </FormControl>
            )}
          </Flex>
          <Button
            size="lg"
            variant="primary"
            mt="30px"
            isLoading={isSubmitting}
            onPress={handleSubmit(handleSave)}
          >
            Save
          </Button>
        </Container>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

export default Trip
