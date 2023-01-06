import React, { useState } from 'react'
import {
  SafeAreaView,
  useWindowDimensions,
  StyleSheet,
  Animated,
  TouchableOpacity
} from 'react-native'
import { Flex, Image, ScrollView, Text, View } from 'native-base'
import TabScreen from '../components/TabScreen'
import { useQuery } from '@tanstack/react-query'
import { getUserSettings } from '../services/database'
import { printPlacesGrid } from '../services/helpers'
import { TabView, SceneMap } from 'react-native-tab-view'

const FirstRoute = () => {
  const { data: settings } = useQuery(['settings'], getUserSettings)
  const { badges } = settings || {}
  const badgesGroup = printPlacesGrid(badges)

  // console.log('badges', badgesGroup[0][0].photos)

  const renderItem = (item) => (
    <Flex
      key={`${item.place_id}`}
      flex="1"
      bg="white"
      mx="10px"
      borderRadius="16px"
      borderWidth="5px"
      borderColor={item.acitve ? 'secondary.400' : '#F3F3F6'}
      align="center"
    >
      <Image
        w="100%"
        aspectRatio={1}
        borderRadius="12px"
        alt={item.photos[0].photo_reference}
        source={{
          uri: `https://maps.googleapis.com/maps/api/place/photo?photoreference=${item.photos[0].photo_reference}&sensor=false&maxheight=200&maxwidth=200&key=AIzaSyCe80iwSU9qzr-p5Zj8jQVfcjZFa9k_zHs`
        }}
      />
      {/*<Flex*/}
      {/*  left="0"*/}
      {/*  right="0"*/}
      {/*  top="0"*/}
      {/*  bottom="0"*/}
      {/*  borderRadius="16px"*/}
      {/*  bg="#88888890"*/}
      {/*  position="absolute"*/}
      {/*/>*/}
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
          variant={`placeName${item.active ? 'Act' : ''}`}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        <Text variant={`placeDistance${item.active ? 'Act' : ''}`}>130 KM</Text>
      </Flex>
    </Flex>
  )

  return (
    <ScrollView key="landmarks" flex="1" mb="40px" mx="0">
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

const SecondRoute = () => <View key="cities" flex="1" bg="#F3F3F6" />

const ThreeRoute = () => <View key="milestones" flex="1" bg="#F3F3F6" />

const renderScene = SceneMap({
  landmarks: FirstRoute,
  cities: SecondRoute,
  milestones: ThreeRoute
})

const Achievements = () => {
  const { width } = useWindowDimensions()
  const [index, setIndex] = useState(0)
  const [routes, setRoutes] = useState([
    { key: 'landmarks', title: 'Landmarks' },
    { key: 'cities', title: 'Cities' },
    { key: 'milestones', title: 'Milestones' }
  ])

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
          6 Badges
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
