import React, { useState, useRef, useCallback } from 'react'
import {
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
  StyleSheet,
  Animated,
  View
} from 'react-native'
import { Flex, Text, Pressable, Box } from 'native-base'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import haptics from '../utils/haptics'
import logger from '../utils/logger'

const steps = [
  {
    title: 'Walk Your Way\nAround the World',
    subtitle: 'Step by step, mile by mile',
    description:
      'Track your daily steps and watch them transform into a virtual journey across the globe.',
    icon: '\u{1F6B6}',
    accent: '#C4EB64'
  },
  {
    title: 'Discover\nAmazing Places',
    subtitle: 'Explore without limits',
    description:
      'Unlock landmarks, cities, and hidden gems as you walk. Every step brings a new discovery.',
    icon: '\u{1F30D}',
    accent: '#4ECDC4'
  },
  {
    title: 'Track Your\nProgress',
    subtitle: 'See how far you have come',
    description:
      'See detailed stats, earn badges, and hit milestones. Your journey is always moving forward.',
    icon: '\u{1F4CA}',
    accent: '#FFB347'
  },
  {
    title: 'Challenge\nYourself',
    subtitle: 'Push your boundaries',
    description:
      'Set goals, join challenges, race friends, and share your achievements with the community.',
    icon: '\u{1F3C6}',
    accent: '#A78BFA'
  }
]

const Onboarding = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef(null)
  const { width } = useWindowDimensions()
  const { navigate } = useNavigation()
  const scrollX = useRef(new Animated.Value(0)).current
  const buttonScale = useRef(new Animated.Value(1)).current

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true')
    } catch (error) {
      logger.log('Error saving onboarding status:', error)
    }
    navigate('Welcome')
  }, [navigate])

  const handleNext = useCallback(() => {
    haptics.light()
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 60, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start()

    if (currentIndex < steps.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true
      })
    } else {
      haptics.success()
      completeOnboarding()
    }
  }, [currentIndex, completeOnboarding, buttonScale])

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index)
    }
  }).current

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50
  }).current

  const renderStep = useCallback(
    ({ item, index }) => {
      const inputRange = [
        (index - 1) * width,
        index * width,
        (index + 1) * width
      ]

      const iconScale = scrollX.interpolate({
        inputRange,
        outputRange: [0.6, 1, 0.6],
        extrapolate: 'clamp'
      })

      const iconOpacity = scrollX.interpolate({
        inputRange,
        outputRange: [0, 1, 0],
        extrapolate: 'clamp'
      })

      const textTranslateY = scrollX.interpolate({
        inputRange,
        outputRange: [30, 0, 30],
        extrapolate: 'clamp'
      })

      return (
        <View style={[styles.stepContainer, { width }]}>
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: `${item.accent}20`,
                transform: [{ scale: iconScale }],
                opacity: iconOpacity
              }
            ]}
          >
            <Text style={styles.icon}>{item.icon}</Text>
          </Animated.View>
          <Animated.View
            style={{
              opacity: iconOpacity,
              transform: [{ translateY: textTranslateY }]
            }}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={[styles.subtitle, { color: item.accent }]}>
              {item.subtitle}
            </Text>
            <Text style={styles.description}>{item.description}</Text>
          </Animated.View>
        </View>
      )
    },
    [width, scrollX]
  )

  const keyExtractor = useCallback((_, index) => index.toString(), [])

  const currentAccent = steps[currentIndex]?.accent || '#C4EB64'

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A2225" />

      <Flex direction="row" justifyContent="flex-end" px={5} pt={3}>
        <Pressable onPress={completeOnboarding} hitSlop={8}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </Flex>

      <Animated.FlatList
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
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index
        })}
        style={styles.flatList}
      />

      <Box alignItems="center" mb={4}>
        {/* Animated dot indicators */}
        <Flex direction="row" justifyContent="center" mb={6}>
          {steps.map((step, index) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [
                (index - 1) * width,
                index * width,
                (index + 1) * width
              ],
              outputRange: [10, 28, 10],
              extrapolate: 'clamp'
            })
            const dotOpacity = scrollX.interpolate({
              inputRange: [
                (index - 1) * width,
                index * width,
                (index + 1) * width
              ],
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp'
            })

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor: step.accent
                  }
                ]}
              />
            )
          })}
        </Flex>

        <Animated.View style={{ transform: [{ scale: buttonScale }], width: '85%' }}>
          <Pressable
            style={[styles.nextButton, { backgroundColor: currentAccent }]}
            onPress={handleNext}
            accessibilityRole="button"
            accessibilityLabel={currentIndex === steps.length - 1 ? 'Get Started' : 'Next'}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === steps.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </Pressable>
        </Animated.View>
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
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500'
  },
  iconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40
  },
  icon: {
    fontSize: 72,
    textAlign: 'center'
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 40
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16
  },
  description: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 8
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4
  },
  nextButton: {
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A2225'
  }
})

export default Onboarding
