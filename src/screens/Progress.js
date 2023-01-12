import React, { useState } from 'react'
import { Animated, SafeAreaView } from 'react-native'
import { Flex, Text, Avatar, Progress as ProgressNative } from 'native-base'
import { useQuery } from '@tanstack/react-query'
import { getUserSettings } from '../services/database'
import TabScreen from '../components/TabScreen'
import WalkingIcon from '../assets/icons/walking.svg'
import moment from 'moment'
import {
  calcProgress,
  calcRemaining,
  getStats,
  prettifyNum,
  stepsToDistance
} from '../services/helpers'

const Progress = () => {
  const [activeColor, _] = useState(new Animated.Value(0))
  const { data: settings } = useQuery(['settings'], getUserSettings)
  const { data: stats } = useQuery(['stats'], getStats)
  const { destination, distance, steps, completed } = settings || {}

  const color = activeColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgb(37,176,37)', 'rgb(184,250,184)']
  })

  Animated.loop(
    Animated.sequence([
      Animated.timing(activeColor, {
        toValue: 1,
        duration: 1000,
        delay: 1000,
        useNativeDriver: false
      }),
      Animated.timing(activeColor, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false
      })
    ])
  ).start()

  const renderProgressItem = (item) => (
    <Flex
      key={item.id}
      bg="white"
      px="16px"
      borderRadius="16px"
      direction="row"
      align="center"
    >
      <Flex
        w="70px"
        h="70px"
        mr="16px"
        bg="gray.300"
        align="center"
        justify="center"
        borderRadius="12px"
      >
        <Text variant="place">
          {moment(item.date).format('DD').toUpperCase()}
        </Text>
        <Text variant="cityName">
          {moment(item.date).format('MMM').toUpperCase()}
        </Text>
      </Flex>
      <Flex
        flex="1"
        py="25px"
        justify="center"
        borderColor="gray.200"
        borderBottomWidth={item.id === 'ThreeDaysBefore' ? '0' : '1px'}
      >
        {/*<Text*/}
        {/*  variant="progress"*/}
        {/*  color="gray.500"*/}
        {/*  fontWeight="300"*/}
        {/*  numberOfLines={1}*/}
        {/*>*/}
        {/*  {moment(item.date).format('DD MMM').toUpperCase()}*/}
        {/*</Text>*/}
        <Text
          m="0"
          variant="to"
          color="primary.400"
          fontWeight="400"
          numberOfLines={1}
        >
          {stepsToDistance(item.steps)} KM
        </Text>
        <Text
          variant="progress"
          color="gray.500"
          fontWeight="400"
          numberOfLines={1}
        >
          {prettifyNum(item.steps)} Steps
        </Text>
      </Flex>
    </Flex>
  )

  return (
    <TabScreen>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F3F6' }}>
        <Flex
          h="120px"
          bg="border"
          left="19px"
          right="19px"
          top="11px"
          position="absolute"
          borderRadius="16px"
        />
        <Flex h="100px" bg="secondary.400" borderBottomRadius="16px" />
        <Flex
          h="120px"
          p="20px"
          bg="white"
          left="20px"
          right="20px"
          top="10px"
          position="absolute"
          borderRadius="16px"
        >
          <Flex direction="row">
            <Flex flex="1" direction="row">
              <Text
                flexShrink="1"
                variant="to"
                color="primary"
                mr="12px"
                numberOfLines={1}
              >
                {destination?.title || ''}
              </Text>
              <Text
                variant="to"
                color="primary.400"
                fontWeight="900"
                numberOfLines={1}
              >
                {prettifyNum(distance.toFixed(2))} KM
              </Text>
            </Flex>
          </Flex>
          <Flex flex="1" />
          <Flex direction="row">
            <Flex flex="1">
              <Text variant="progress" mr="10px" numberOfLines={1}>
                {!!completed ? 'Completed' : `${stepsToDistance(steps)} KM`}
              </Text>
            </Flex>
            {!completed && (
              <Text
                variant="progress"
                color="gray.400"
                fontWeight="400"
                numberOfLines={1}
              >
                Remaining {calcRemaining(steps, distance)} KM
              </Text>
            )}
          </Flex>
          <ProgressNative
            colorScheme="green"
            value={calcProgress(steps, distance)}
            mt="6px"
          />
        </Flex>
        <Flex flex="1" px="20px" mt="50px" w="100%" minW="100%">
          <Flex
            h="70px"
            w="100%"
            py="8px"
            pl="10px"
            pr="24px"
            bg="white"
            borderRadius="50px"
            direction="row"
          >
            <Animated.View
              style={{
                width: 20,
                height: 20,
                top: 0,
                right: 2,
                borderRadius: 20,
                position: 'absolute',
                borderColor: 'white',
                borderWidth: 5,
                backgroundColor: color
              }}
            />
            <Avatar w="54px" h="54px" mr="12px" bg="gray.100">
              <WalkingIcon width={30} />
            </Avatar>
            <Flex flex="1" justify="center">
              <Text
                m="0"
                variant="to"
                color="primary.400"
                fontWeight="400"
                numberOfLines={1}
              >
                Today's progress
              </Text>
              <Text
                variant="progress"
                color="gray.400"
                fontWeight="400"
                numberOfLines={1}
              >
                {prettifyNum((stats || [{}])[0].steps)} Steps
              </Text>
            </Flex>
            <Flex justify="center">
              <Text
                m="0"
                variant="to"
                color="primary.400"
                textAlign="right"
                numberOfLines={1}
              >
                {stepsToDistance((stats || [{}])[0].steps)}
              </Text>
              <Text
                variant="progress"
                textAlign="right"
                fontWeight="500"
                numberOfLines={1}
              >
                KM
              </Text>
            </Flex>
          </Flex>
          <Flex
            flex="1"
            mt="20px"
            py="10px"
            mb="80px"
            bg="white"
            borderRadius="16px"
          >
            {(stats || []).slice(1).map(renderProgressItem)}
          </Flex>
        </Flex>
      </SafeAreaView>
    </TabScreen>
  )
}

export default Progress
