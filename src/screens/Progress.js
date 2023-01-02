import React, { useState } from 'react'
import { SafeAreaView } from 'react-native'
import {
  Flex,
  Text,
  Progress as ProgressNative,
  Avatar,
  Box
} from 'native-base'
import { useQuery } from '@tanstack/react-query'
import { getUserSettings } from '../services/database'
import TabScreen from '../components/TabScreen'
import WalkingIcon from '../assets/icons/walking.svg'
import moment from 'moment'

const Progress = () => {
  const [stats, setStats] = useState([
    { id: '1', date: new Date(), steps: 145 },
    { id: '2', date: new Date(), steps: 344 },
    { id: '3', date: new Date(), steps: 524 },
    { id: '4', date: new Date(), steps: 1224 }
  ])
  const { data: settings } = useQuery(['settings'], getUserSettings)
  const { destination, progress, distance, steps } = settings || {}

  const renderProgressItem = (item, index) => (
    <Flex
      key={item.id}
      bg="white"
      px="16px"
      borderRadius="16px"
      direction="row"
      align="center"
    >
      <Box w="70px" h="70px" mr="16px" bg="gray.300" borderRadius="12px" />
      <Flex
        flex="1"
        py="16px"
        justify="center"
        borderBottomWidth={index === stats.length - 1 ? '0' : '1px'}
        borderColor="gray.200"
      >
        <Text
          variant="progress"
          color="gray.500"
          fontWeight="300"
          numberOfLines={1}
        >
          {moment(item.date).format('DD MMM').toUpperCase()}
        </Text>
        <Text
          m="0"
          variant="to"
          color="primary.400"
          fontWeight="400"
          numberOfLines={1}
        >
          {item.steps || '0'} KM
        </Text>
        <Text
          variant="progress"
          color="gray.500"
          fontWeight="400"
          numberOfLines={1}
        >
          {item.steps || '0'} Steps
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
                {distance || '0'} KM
              </Text>
            </Flex>
          </Flex>
          <Flex flex="1" />
          <Flex direction="row">
            <Flex flex="1">
              <Text variant="progress" mr="10px" numberOfLines={1}>
                {progress || '0'} KM
              </Text>
            </Flex>
            <Text
              variant="progress"
              color="gray.400"
              fontWeight="400"
              numberOfLines={1}
            >
              Remaining {distance - progress || '0'} KM
            </Text>
          </Flex>
          <ProgressNative colorScheme="green" value={55} mt="6px" />
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
                {steps || '0'} Steps
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
                {steps || '0'}
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
            {stats.map(renderProgressItem)}
          </Flex>
        </Flex>
      </SafeAreaView>
    </TabScreen>
  )
}

export default Progress
