import React, { useEffect, useRef, useState } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { Alert, Platform, SafeAreaView, StatusBar } from 'react-native'
import { appleAuth } from '@invertase/react-native-apple-authentication'
import { Button, Container, Text, useToast, Box, VStack, HStack, Pressable, ScrollView } from 'native-base'
import auth from '@react-native-firebase/auth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { clearLocalAccountData, getUserData } from '../services/database'
import { deleteAccount } from '../services/api'
import { clearNotifications } from '../services/notifications'
import { getStreakData, setDailyGoal } from '../services/streak'
import TabScreen from '../components/TabScreen'

const GOAL_OPTIONS = [5000, 8000, 10000, 12000, 15000, 20000]

const Profile = () => {
  const { reset, navigate } = useNavigation()
  const isFocused = useIsFocused()
  const toast = useToast()
  const queryClient = useQueryClient()
  const user = auth().currentUser
  const deleting = useRef(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showGoalPicker, setShowGoalPicker] = useState(false)

  const { data: profile, isLoading: profileLoading } = useQuery(
    ['profile'],
    getUserData
  )

  const { data: streakData, refetch: refetchStreak } = useQuery(
    ['streak-profile'],
    getStreakData,
    { staleTime: 10 * 1000 }
  )

  const currentGoal = streakData?.dailyGoal || 10000
  const currentStreak = streakData?.currentStreak || 0
  const longestStreak = streakData?.longestStreak || 0

  const returnToWelcome = () => {
    queryClient.clear()
    if (Platform.OS === 'ios') {
      try {
        clearNotifications()
      } catch {
        toast.show({ status: 'info', description: 'Some delivered notifications may remain on this device.' })
      }
    }
    reset({ index: 0, routes: [{ name: 'Welcome' }] })
  }

  const handleLogOut = async () => {
    if (!user || auth().currentUser?.uid !== user.uid || deleting.current) return
    try {
      await auth().signOut()
      if (!auth().currentUser) returnToWelcome()
    } catch {
      toast.show({ status: 'error', description: 'Could not sign out. Try again.' })
    }
  }

  const removeAccount = async () => {
    if (!user || auth().currentUser?.uid !== user.uid || deleting.current) return
    deleting.current = true
    setIsDeleting(true)
    try {
      if (user.providerData.some((provider) => provider.providerId === 'apple.com')) {
        const { identityToken, nonce, authorizationCode } = await appleAuth.performRequest({
          requestedOperation: appleAuth.Operation.LOGIN
        })
        if (auth().currentUser?.uid !== user.uid) return
        if (!identityToken || !authorizationCode) {
          throw new Error('Could not verify your Apple account. Try again.')
        }
        await user.reauthenticateWithCredential(auth.AppleAuthProvider.credential(identityToken, nonce))
        if (auth().currentUser?.uid !== user.uid) return
        await auth().revokeToken(authorizationCode)
      }
      await user.getIdToken(true)
      if (auth().currentUser?.uid !== user.uid) return
      await deleteAccount(user.uid)
      try {
        await clearLocalAccountData(user.uid)
      } catch {
        Alert.alert('Account deleted', 'TravelFit could not remove its local files. Removing the app clears them from this device.')
      }
      if (auth().currentUser?.uid === user.uid) await auth().signOut().catch(() => {})
      if (!auth().currentUser) returnToWelcome()
    } catch (error) {
      if (error.code === appleAuth.Error.CANCELED || auth().currentUser?.uid !== user.uid) return
      toast.show({
        status: 'error',
        description: error.code === 'functions/failed-precondition'
          ? error.message
          : 'Could not delete your account. Try again.'
      })
    } finally {
      deleting.current = false
      setIsDeleting(false)
    }
  }

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'Your account and saved trips on this device will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete account', style: 'destructive', onPress: removeAccount }
      ]
    )
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

  const prettifyGoal = (n) => n.toLocaleString()

  return (
    <TabScreen>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F3F6' }}>
        <ScrollView flex="1" showsVerticalScrollIndicator={false} testID="profile-content">
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

              {/* Weekly/Monthly Stats */}
              <Pressable
                onPress={() => navigate('WeeklyStats')}
                accessibilityLabel="View weekly and monthly statistics"
                accessibilityRole="button"
                testID="profile-statistics"
              >
                <Box bg="white" borderRadius="16px" p="20px">
                  <HStack justifyContent="space-between" alignItems="center">
                    <HStack space="3" alignItems="center">
                      <Text fontSize="20px">{'\uD83D\uDCCA'}</Text>
                      <VStack>
                        <Text fontSize="16px" fontWeight="600">Statistics</Text>
                        <Text fontSize="13px" color="gray.500">Weekly & monthly breakdown</Text>
                      </VStack>
                    </HStack>
                    <Text fontSize="16px" color="gray.400">{'>'}</Text>
                  </HStack>
                </Box>
              </Pressable>

              {/* Trip History */}
              <Pressable
                onPress={() => navigate('TripHistory')}
                accessibilityLabel="View trip history"
                testID="profile-trip-history"
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

              {/* Curated Routes */}
              <Pressable
                onPress={() => navigate('CuratedRoutes')}
                accessibilityLabel="Browse curated routes"
                accessibilityRole="button"
              >
                <Box bg="white" borderRadius="16px" p="20px">
                  <HStack justifyContent="space-between" alignItems="center">
                    <HStack space="3" alignItems="center">
                      <Text fontSize="20px">{'\u2728'}</Text>
                      <VStack>
                        <Text fontSize="16px" fontWeight="600">Curated Routes</Text>
                        <Text fontSize="13px" color="gray.500">Popular walking journeys</Text>
                      </VStack>
                    </HStack>
                    <Text fontSize="16px" color="gray.400">{'>'}</Text>
                  </HStack>
                </Box>
              </Pressable>

              {/* Notification Settings */}
              <Pressable
                onPress={() => navigate('NotificationSettings')}
                accessibilityLabel="Notification settings"
                accessibilityRole="button"
              >
                <Box bg="white" borderRadius="16px" p="20px">
                  <HStack justifyContent="space-between" alignItems="center">
                    <HStack space="3" alignItems="center">
                      <Text fontSize="20px">{'\uD83D\uDD14'}</Text>
                      <VStack>
                        <Text fontSize="16px" fontWeight="600">Notifications</Text>
                        <Text fontSize="13px" color="gray.500">Reminders & alerts</Text>
                      </VStack>
                    </HStack>
                    <Text fontSize="16px" color="gray.400">{'>'}</Text>
                  </HStack>
                </Box>
              </Pressable>

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
                isDisabled={isDeleting}
                accessibilityLabel="Sign out of your account"
                testID="profile-sign-out"
              >
                Sign Out
              </Button>

              <Button
                size="md"
                variant="ghost"
                colorScheme="danger"
                isLoading={isDeleting}
                onPress={confirmDeleteAccount}
                testID="profile-delete-account"
              >
                Delete Account
              </Button>
            </VStack>
          </Container>
        </ScrollView>
      </SafeAreaView>
    </TabScreen>
  )
}

export default Profile
