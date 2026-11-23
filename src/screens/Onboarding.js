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
    title: 'Take your steps somewhere new',
    description: 'Pick a virtual route and use your Apple Health steps to explore it from wherever you walk.',
    icon: '↗'
  },
  {
    title: 'Discover a landmark as you walk',
    description: 'Watch your position move along the map, reach landmarks, and see how far you’ve come.',
    icon: '●'
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
        <Text style={styles.description}>{item.description}</Text>
      </Flex>
    ),
    [width]
  )

  const keyExtractor = useCallback((_, index) => index.toString(), [])
  const nextLabel = currentIndex === steps.length - 1 ? 'Get Started' : 'Next'

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A2225" />

      <Flex direction="row" justifyContent="flex-end" px={5} pt={3}>
        <Pressable
          onPress={completeOnboarding}
          onAccessibilityTap={completeOnboarding}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Skip"
          testID="onboarding-skip"
        >
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

        <Pressable
          style={styles.nextButton}
          onPress={handleNext}
          onAccessibilityTap={handleNext}
          accessibilityRole="button"
          accessibilityLabel={nextLabel}
        >
          <Text style={styles.nextButtonText}>{nextLabel}</Text>
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
    color: '#C4EB64',
    fontSize: 64,
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
