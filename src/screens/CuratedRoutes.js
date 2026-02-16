import React, { useState } from 'react'
import { SafeAreaView, StatusBar } from 'react-native'
import {
  Box,
  Text,
  VStack,
  HStack,
  Flex,
  ScrollView,
  Pressable
} from 'native-base'
import { useNavigation } from '@react-navigation/native'
import BackSVG from '../assets/icons/back.svg'
import { CURATED_ROUTES, CATEGORIES, DIFFICULTY_COLORS } from '../data/curatedRoutes'

const CuratedRoutes = () => {
  const { goBack, navigate } = useNavigation()
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredRoutes = selectedCategory === 'all'
    ? CURATED_ROUTES
    : CURATED_ROUTES.filter((route) => route.category === selectedCategory)

  const handleStartTrip = (route) => {
    navigate('Trip', {
      curatedOrigin: route.origin,
      curatedDestination: route.destination
    })
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F3F6' }}>
      <StatusBar barStyle="dark-content" />

      <Flex direction="row" align="center" px="16px" py="12px">
        <Pressable onPress={goBack} p="4px" accessibilityLabel="Go back" accessibilityRole="button">
          <BackSVG />
        </Pressable>
        <Text fontSize="20px" fontWeight="700" ml="12px" accessibilityRole="header">
          Curated Routes
        </Text>
      </Flex>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        px="16px"
        mb="8px"
        style={{ flexGrow: 0 }}
      >
        <HStack space="2" px="16px" py="8px">
          {Object.entries(CATEGORIES).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setSelectedCategory(key)}
              accessibilityLabel={`Filter by ${label}`}
              accessibilityRole="button"
            >
              <Box
                px="16px"
                py="8px"
                borderRadius="20px"
                bg={selectedCategory === key ? 'primary.400' : 'white'}
              >
                <Text
                  fontSize="14px"
                  fontWeight="600"
                  color={selectedCategory === key ? 'white' : 'gray.600'}
                >
                  {label}
                </Text>
              </Box>
            </Pressable>
          ))}
        </HStack>
      </ScrollView>

      <ScrollView flex="1" px="20px" showsVerticalScrollIndicator={false}>
        <VStack space="3" pb="40px">
          {filteredRoutes.map((route) => (
            <Box key={route.id} bg="white" borderRadius="16px" p="16px">
              <VStack space="2">
                <Text fontSize="18px" fontWeight="700" color="primary.400">
                  {route.title}
                </Text>

                <HStack alignItems="center" space="1">
                  <Text fontSize="14px" color="gray.500">
                    {route.origin.name}
                  </Text>
                  <Text fontSize="14px" color="gray.400">
                    {' -> '}
                  </Text>
                  <Text fontSize="14px" color="gray.500" flex="1" numberOfLines={1}>
                    {route.destination.name}
                  </Text>
                </HStack>

                <HStack alignItems="center" space="3">
                  <Text fontSize="14px" fontWeight="600" color="primary.400">
                    {route.distance} km
                  </Text>

                  <Box
                    px="10px"
                    py="2px"
                    borderRadius="12px"
                    bg={`${DIFFICULTY_COLORS[route.difficulty]}.100`}
                  >
                    <Text
                      fontSize="12px"
                      fontWeight="700"
                      color={`${DIFFICULTY_COLORS[route.difficulty]}.700`}
                    >
                      {route.difficulty}
                    </Text>
                  </Box>

                  <Text fontSize="12px" color="gray.400">
                    ~{route.estimatedDays} days
                  </Text>
                </HStack>

                <Text fontSize="13px" color="gray.500" lineHeight="18px">
                  {route.description}
                </Text>

                <HStack flexWrap="wrap" space="2" mt="4px">
                  {route.highlights.map((highlight) => (
                    <Box
                      key={highlight}
                      px="10px"
                      py="4px"
                      borderRadius="8px"
                      bg="gray.100"
                      mb="4px"
                    >
                      <Text fontSize="12px" color="gray.600" fontWeight="500">
                        {highlight}
                      </Text>
                    </Box>
                  ))}
                </HStack>

                <Pressable
                  onPress={() => handleStartTrip(route)}
                  mt="8px"
                  bg="primary.400"
                  py="10px"
                  borderRadius="12px"
                  alignItems="center"
                  accessibilityLabel={`Start trip from ${route.origin.name} to ${route.destination.name}`}
                  accessibilityRole="button"
                >
                  <Text fontSize="14px" fontWeight="700" color="white">
                    Start This Trip
                  </Text>
                </Pressable>
              </VStack>
            </Box>
          ))}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  )
}

export default CuratedRoutes
