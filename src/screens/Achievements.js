import React, { useState } from 'react'
import {
  SafeAreaView,
  useWindowDimensions,
  StyleSheet,
  Animated,
  TouchableOpacity
} from 'react-native'
import { Flex, Image, Progress, ScrollView, Text, View } from 'native-base'
import TabScreen from '../components/TabScreen'
import { useQuery } from '@tanstack/react-query'
import { getUserSettings } from '../services/database'
import {
  prettifyNum,
  printGrid,
  printK,
  stepsToDistance
} from '../services/helpers'
import { SceneMap, TabView } from 'react-native-tab-view'

const LandmarksRoute = ({ route: { data } }) => {
  const badgesGroup = printGrid(data)

  const renderItem = ({ place_id, name, progress = 0, photos }) => (
    <Flex
      key={`${place_id}`}
      flex="1"
      bg="white"
      mx="10px"
      borderRadius="16px"
      borderWidth="5px"
      borderColor={progress > 0 ? '#a3cb88' : '#F3F3F6'}
      align="center"
    >
      <Image
        w="100%"
        aspectRatio={1}
        borderRadius="12px"
        alt={photos[0].photo_reference}
        source={{
          uri: `https://maps.googleapis.com/maps/api/place/photo?photoreference=${photos[0].photo_reference}&sensor=false&maxheight=200&maxwidth=200&key=AIzaSyCe80iwSU9qzr-p5Zj8jQVfcjZFa9k_zHs`
        }}
      />
      {progress === 0 && (
        <Flex
          left="0"
          right="0"
          top="0"
          bottom="0"
          borderRadius="16px"
          bg="#88888890"
          position="absolute"
        />
      )}
      <Flex
        flex="1"
        left="0"
        right="0"
        bottom="0"
        p="5px"
        borderBottomRadius="10px"
        bg="#11111195"
        justify="center"
        position="absolute"
      >
        <Text
          variant={`placeName${progress > 0 ? 'Act' : ''}`}
          numberOfLines={2}
        >
          {name}
        </Text>
        {progress === 100 && <Text variant="placeDistance">Completed</Text>}
        {progress > 0 && progress < 100 && (
          <Progress colorScheme="green" value={progress} my="5px" />
        )}
        {progress === 0 && <Progress colorScheme="gray" value={100} my="5px" />}
      </Flex>
    </Flex>
  )

  return (
    <ScrollView key="Landmarks" flex="1" mb="40px" mx="0">
      <Flex pb="30px" pt="10px">
        {badgesGroup.map((group, index) => (
          <Flex key={index} direction="row" m="10px">
            {group.map((badge) => renderItem(badge))}
          </Flex>
        ))}
      </Flex>
    </ScrollView>
  )
}

const CitiesRoute = ({ route: { data } }) => {
  const citiesGroup = printGrid(data)

  const renderItem = ({ place_id, name, photos }) => (
    <Flex
      key={`${place_id}`}
      flex="1"
      bg="white"
      mx="10px"
      borderRadius="16px"
      borderWidth="2px"
      borderColor="border"
      align="center"
    >
      <Image
        w="100%"
        aspectRatio={1.3}
        borderTopRadius="12px"
        alt={photos[0].photo_reference}
        source={{
          uri: `https://maps.googleapis.com/maps/api/place/photo?photoreference=${photos[0].photo_reference}&sensor=false&maxheight=200&maxwidth=200&key=AIzaSyCe80iwSU9qzr-p5Zj8jQVfcjZFa9k_zHs`
        }}
      />
      <Flex py="12px" px="5px" borderBottomRadius="10px" justify="center">
        <Text variant="cityName" numberOfLines={2}>
          {name}
        </Text>
      </Flex>
    </Flex>
  )

  return (
    <ScrollView key="Cities" flex="1" mb="40px" mx="0">
      <Flex pb="30px" pt="10px">
        {citiesGroup.map((group, index) => (
          <Flex key={index} direction="row" m="10px">
            {group.map((city) => renderItem(city))}
            {group.length === 1 && <Flex flex="1" />}
          </Flex>
        ))}
      </Flex>
    </ScrollView>
  )
}

const MilestonesRoute = ({ route: { data } }) => {
  const achievedGroup = printGrid(data)

  const renderItem = (distance) => (
    <Flex
      key={`${distance}`}
      flex="1"
      bg="white"
      mx="10px"
      p="15px"
      borderRadius="16px"
      borderWidth="2px"
      borderColor="border"
      align="center"
    >
      <Flex
        p="5px"
        w="100%"
        bg="primary.400"
        aspectRatio={1}
        justify="center"
        borderRadius="120px"
      >
        <Text variant="milestone" numberOfLines={1}>
          {printK(distance)}
        </Text>
        <Text variant="km" numberOfLines={1}>
          KM
        </Text>
      </Flex>
      <Flex pt="12px" px="5px" borderBottomRadius="10px" justify="center">
        <Text variant="cityName" numberOfLines={1}>
          {prettifyNum(distance)} KM
        </Text>
        <Text variant="cityName" numberOfLines={1}>
          Completed
        </Text>
      </Flex>
    </Flex>
  )

  return (
    <ScrollView key="Milestones" flex="1" mb="40px" mx="0">
      <Flex pb="30px" pt="10px">
        {achievedGroup.map((group, index) => (
          <Flex key={index} direction="row" m="10px">
            {group.map((distance) => renderItem(distance))}
            {group.length === 1 && <Flex flex="1" />}
          </Flex>
        ))}
      </Flex>
    </ScrollView>
  )
}

const Achievements = () => {
  const { width } = useWindowDimensions()
  const [index, setIndex] = useState(0)
  const { data: settings } = useQuery(['settings'], getUserSettings)
  const { badges, cities, steps } = settings || {}
  const milestones = [
    1, 5, 10, 50, 100, 200, 500, 1000, 5000, 10000, 20000, 50000, 100000
  ]
  const progress = stepsToDistance(steps)
  const achieved = milestones.filter((x) => x <= progress)

  if (typeof settings === 'undefined') return <TabScreen />

  const routes = [
    { key: 'Landmarks', title: 'Landmarks', data: badges },
    { key: 'Cities', title: 'Cities', data: cities },
    { key: 'Milestones', title: 'Milestones', data: achieved }
  ]

  const renderTabBar = ({ navigationState, position }) => {
    const inputRange = navigationState.routes.map((x, i) => i)
    return (
      <View style={styles.tabBar}>
        {navigationState.routes.map((route, i) => {
          const opacity = position.interpolate({
            inputRange,
            outputRange: inputRange.map((inputIndex) =>
              inputIndex === i ? 1 : 0.5
            )
          })
          return (
            <TouchableOpacity
              key={route.title}
              style={styles.tabItem}
              onPress={() => setIndex(i)}
            >
              <Animated.Text style={{ ...styles.tab, opacity }}>
                {route.title}
              </Animated.Text>
            </TouchableOpacity>
          )
        })}
      </View>
    )
  }

  const renderScene = SceneMap({
    Landmarks: LandmarksRoute,
    Cities: CitiesRoute,
    Milestones: MilestonesRoute
  })

  return (
    <TabScreen>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F3F6' }}>
        <Flex h="40px" bg="secondary.400" borderBottomRadius="16px" />
        <Text
          top="0"
          right="10px"
          left="10px"
          fontSize="19px"
          fontWeight="700"
          textAlign="center"
          position="absolute"
        >
          {badges.filter((x) => x.progress > 0).length +
            cities.length +
            achieved.length}{' '}
          Badges
        </Text>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          renderTabBar={renderTabBar}
          onIndexChange={setIndex}
          initialLayout={{ width }}
        />
      </SafeAreaView>
    </TabScreen>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    marginTop: 20,
    marginHorizontal: 20
  },
  tab: {
    fontSize: 14,
    fontWeight: '500'
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16
  }
})

export default Achievements
