import React, { useEffect, useState } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { SafeAreaView, StatusBar, Platform } from 'react-native'
import { Button, Container, Text, useToast, Box, VStack, HStack, Pressable, ScrollView } from 'native-base'
import auth from '@react-native-firebase/auth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getUserData, getUserSettings } from '../services/database'
import { iapService } from '../services/iap'
import { markPaymentFlowCompleted } from '../services/subscription'
import { getStreakData, setDailyGoal } from '../services/streak'
import TabScreen from '../components/TabScreen'

const GOAL_OPTIONS = [5000, 8000, 10000, 12000, 15000, 20000]

const Profile = () => {
  const { reset, navigate } = useNavigation()
  const isFocused = useIsFocused()
  const toast = useToast()
  const queryClient = useQueryClient()
  const user = auth().currentUser
  const [isRestoring, setIsRestoring] = useState(false)
  const [showGoalPicker, setShowGoalPicker] = useState(false)

  const { data: profile, isLoading: profileLoading } = useQuery(
    ['profile'],
    getUserData
  )

  const { data: userSettings } = useQuery(['settings'], getUserSettings)
  const currentSubscription = userSettings?.subscription

  const { data: streakData, refetch: refetchStreak } = useQuery(
    ['streak-profile'],
    getStreakData,
    { staleTime: 10 * 1000 }
  )

  const currentGoal = streakData?.dailyGoal || 10000
  const currentStreak = streakData?.currentStreak || 0
  const longestStreak = streakData?.longestStreak || 0

  const handleLogOut = async () => {
    try {
      await auth().signOut()
      reset({
        index: 0,
        routes: [{ name: 'Welcome' }]
      })
    } catch (e) {
      console.log('handleLogOut', e)
      toast.show({
        status: 'error',
        description: e.message
      })
    }
  }

  const handleRestorePurchases = async () => {
    if (Platform.OS !== 'ios') return

    setIsRestoring(true)
    try {
      const purchases = await iapService.restorePurchases()
      if (purchases && purchases.length > 0) {
        await markPaymentFlowCompleted()
        toast.show({
          status: 'success',
          description: 'Purchases restored successfully!'
        })
      } else {
        toast.show({
          status: 'info',
          description: 'No previous purchases found.'
        })
      }
    } catch (error) {
      console.log('Restore error:', error)
      toast.show({
        status: 'error',
        description: 'Failed to restore purchases. Please try again.'
      })
    } finally {
      setIsRestoring(false)
    }
  }

  const handleSetGoal = async (goal) => {
    await setDailyGoal(goal)
    setShowGoalPicker(false)
    await refetchStreak()
    queryClient.invalidateQueries(['streak'])
    toast.show({
      status: 'success',
      description: `Daily goal set to ${goal.toLocaleString()} steps!`
    })
  }

  useEffect(() => {
    if (isFocused) {
      StatusBar.setBarStyle('dark-content', true)
    }
  }, [isFocused])

  if (profileLoading) return <></>

  const handleSubscriptionPress = () => {
    navigate('Subscription')
  }

  const prettifyGoal = (n) => n.toLocaleString()

  return (
    <TabScreen>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F3F6' }}>
        <ScrollView flex="1" showsVerticalScrollIndicator={false}>
          <Container flex="1" px="20px" mt="16px" mb="100px" w="100%" minW="100%">
            <VStack space="5" flex="1">
              {/* User Profile */}
              <Box
                bg="secondary.400"
                borderRadius="16px"
                py="30px"
                px="20px"
                accessibilityRole="summary"
                accessibilityLabel={`Profile: ${profile?.name || ''}, ${user?.email || ''}`}
              >
                <Text fontSize="20px" fontWeight="600">
                  {profile?.name || ''}
                </Text>
                <Text mt="8px">{user?.email || ''}</Text>
              </Box>

              {/* Daily Step Goal */}
              <Box bg="white" borderRadius="16px" p="20px">
                <VStack space="3">
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="18px" fontWeight="600">
                      Daily Step Goal
                    </Text>
                    <Pressable
                      onPress={() => setShowGoalPicker(!showGoalPicker)}
                      accessibilityLabel="Change daily step goal"
                      accessibilityRole="button"
                    >
                      <Text fontSize="14px" color="blue.600" fontWeight="600">
                        {showGoalPicker ? 'Done' : 'Change'}
                      </Text>
                    </Pressable>
                  </HStack>

                  <HStack space="4" alignItems="center">
                    <Box
                      bg="secondary.400"
                      borderRadius="12px"
                      px="16px"
                      py="12px"
                      alignItems="center"
                    >
                      <Text fontSize="22px" fontWeight="800" color="primary.400">
                        {prettifyGoal(currentGoal)}
                      </Text>
                      <Text fontSize="12px" color="primary.300" fontWeight="500">
                        steps/day
                      </Text>
                    </Box>
                    <VStack flex="1" space="1">
                      <HStack space="2" alignItems="center">
                        <Text fontSize="14px">{'\uD83D\uDD25'}</Text>
                        <Text fontSize="14px" color="gray.700">
                          Current streak: <Text fontWeight="700">{currentStreak} days</Text>
                        </Text>
                      </HStack>
                      {longestStreak > 0 && (
                        <HStack space="2" alignItems="center">
                          <Text fontSize="14px">{'\u2B50'}</Text>
                          <Text fontSize="14px" color="gray.700">
                            Longest streak: <Text fontWeight="700">{longestStreak} days</Text>
                          </Text>
                        </HStack>
                      )}
                    </VStack>
                  </HStack>

                  {/* Goal Picker */}
                  {showGoalPicker && (
                    <VStack space="2" mt="2">
                      <Text fontSize="13px" color="gray.500" fontWeight="500">
                        Select your daily goal:
                      </Text>
                      <HStack flexWrap="wrap" space="2">
                        {GOAL_OPTIONS.map((goal) => (
                          <Pressable
                            key={goal}
                            onPress={() => handleSetGoal(goal)}
                            mb="2"
                            accessibilityLabel={`Set goal to ${prettifyGoal(goal)} steps`}
                            accessibilityRole="button"
                          >
                            <Box
                              bg={currentGoal === goal ? 'primary.400' : 'gray.100'}
                              borderRadius="10px"
                              px="14px"
                              py="8px"
                            >
                              <Text
                                fontSize="14px"
                                fontWeight="600"
                                color={currentGoal === goal ? 'white' : 'primary.400'}
                              >
                                {prettifyGoal(goal)}
                              </Text>
                            </Box>
                          </Pressable>
                        ))}
                      </HStack>
                    </VStack>
                  )}
                </VStack>
              </Box>

              {/* Trip History */}
              <Pressable
                onPress={() => navigate('TripHistory')}
                accessibilityLabel="View trip history"
                accessibilityRole="button"
              >
                <Box bg="white" borderRadius="16px" p="20px">
                  <HStack justifyContent="space-between" alignItems="center">
                    <HStack space="3" alignItems="center">
                      <Text fontSize="20px">{'\uD83D\uDDFA\uFE0F'}</Text>
                      <VStack>
                        <Text fontSize="16px" fontWeight="600">Trip History</Text>
                        <Text fontSize="13px" color="gray.500">View your past journeys</Text>
                      </VStack>
                    </HStack>
                    <Text fontSize="16px" color="gray.400">{'>'}</Text>
                  </HStack>
                </Box>
              </Pressable>

              {/* Subscription Status */}
              <Box bg="white" borderRadius="16px" p="20px">
                <VStack space="4">
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="18px" fontWeight="600">
                      Subscription
                    </Text>
                    {currentSubscription?.isSubscribed ? (
                      <Box bg="green.100" px="3" py="1" borderRadius="full">
                        <Text fontSize="12px" fontWeight="600" color="green.800">
                          Premium
                        </Text>
                      </Box>
                    ) : (
                      <Box bg="gray.100" px="3" py="1" borderRadius="full">
                        <Text fontSize="12px" fontWeight="600" color="gray.800">
                          Free
                        </Text>
                      </Box>
                    )}
                  </HStack>

                  {currentSubscription?.isSubscribed ? (
                    <VStack space="2">
                      <Text fontSize="14px" color="gray.600">
                        You're subscribed to Premium
                      </Text>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                        onPress={handleSubscriptionPress}
                        accessibilityLabel="Manage subscription"
                      >
                        Manage Subscription
                      </Button>
                    </VStack>
                  ) : (
                    <VStack space="2">
                      <Text fontSize="14px" color="gray.600">
                        Upgrade to Premium for unlimited features
                      </Text>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                        onPress={handleSubscriptionPress}
                        accessibilityLabel="Upgrade to premium"
                      >
                        Upgrade Now
                      </Button>
                    </VStack>
                  )}
                </VStack>
              </Box>

              {/* Restore Purchases */}
              {Platform.OS === 'ios' && (
                <Button
                  size="md"
                  variant="ghost"
                  colorScheme="blue"
                  onPress={handleRestorePurchases}
                  isLoading={isRestoring}
                  accessibilityLabel="Restore previous purchases"
                >
                  Restore Purchases
                </Button>
              )}

              {/* Privacy Policy */}
              <Button
                size="md"
                variant="ghost"
                colorScheme="gray"
                onPress={() => navigate('PrivacyPolicy')}
                accessibilityLabel="View privacy policy"
              >
                Privacy Policy
              </Button>

              {/* Sign Out Button */}
              <Button
                size="lg"
                variant="primary"
                onPress={handleLogOut}
                accessibilityLabel="Sign out of your account"
              >
                Sign Out
              </Button>
            </VStack>
          </Container>
        </ScrollView>
      </SafeAreaView>
    </TabScreen>
  )
}

export default Profile
