import React, { useState, useRef, useCallback } from 'react'
import {
  SafeAreaView,
  StatusBar,
  FlatList,
  useWindowDimensions,
  StyleSheet
} from 'react-native'
import { Flex, Text, Pressable, Box } from 'native-base'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const steps = [
  {
    title: 'Walk Your Way Around the World',
    subtitle: 'Step by step, mile by mile',
    description:
      'Track your daily steps and watch them transform into a virtual journey across the globe.',
    icon: '\u{1F6B6}'
  },
  {
    title: 'Discover Amazing Places',
    subtitle: 'Explore without limits',
    description:
      'Unlock landmarks, cities, and hidden gems as you walk. Every step brings a new discovery.',
    icon: '\u{1F30D}'
  },
  {
    title: 'Track Your Progress',
    subtitle: 'See how far you have come',
    description:
      'See detailed stats, earn badges, and hit milestones. Your journey is always moving forward.',
    icon: '\u{1F4CA}'
  },
  {
    title: 'Challenge Yourself',
    subtitle: 'Push your boundaries',
    description:
      'Set goals, join challenges, and share your achievements with friends and the community.',
    icon: '\u{1F3C6}'
  }
]

const Onboarding = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef(null)
  const { width } = useWindowDimensions()
  const { navigate } = useNavigation()

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true')
    } catch (error) {
      console.log('Error saving onboarding status:', error)
    }
    navigate('Welcome')
  }, [navigate])

  const handleNext = useCallback(() => {
    if (currentIndex < steps.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true
      })
    } else {
      completeOnboarding()
    }
  }, [currentIndex, completeOnboarding])

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index)
    }
  }).current

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50
  }).current

  const renderStep = useCallback(
    ({ item }) => (
      <Flex
        width={width}
        flex={1}
        alignItems="center"
        justifyContent="center"
        px={8}
      >
        <Text style={styles.icon}>{item.icon}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </Flex>
    ),
    [width]
  )

  const keyExtractor = useCallback((_, index) => index.toString(), [])

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A2225" />

      <Flex direction="row" justifyContent="flex-end" px={5} pt={3}>
        <Pressable onPress={completeOnboarding} hitSlop={8}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </Flex>

      <FlatList
        ref={flatListRef}
        data={steps}
        renderItem={renderStep}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index
        })}
        style={styles.flatList}
      />

      <Box alignItems="center" mb={4}>
        <Flex direction="row" justifyContent="center" mb={6}>
          {steps.map((_, index) => (
            <Box
              key={index}
              style={[
                styles.dot,
                currentIndex === index ? styles.dotActive : styles.dotInactive
              ]}
            />
          ))}
        </Flex>

        <Pressable style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex === steps.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </Pressable>
      </Box>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2225'
  },
  flatList: {
    flex: 1
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500'
  },
  icon: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: 32
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#C4EB64',
    textAlign: 'center',
    marginBottom: 16
  },
  description: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5
  },
  dotActive: {
    backgroundColor: '#C4EB64'
  },
  dotInactive: {
    backgroundColor: '#555555'
  },
  nextButton: {
    backgroundColor: '#C4EB64',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 20,
    width: '85%',
    alignItems: 'center'
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2225'
  }
})

export default Onboarding
