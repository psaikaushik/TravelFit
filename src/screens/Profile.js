import React, { useEffect, useState } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { SafeAreaView, StatusBar, Platform } from 'react-native'
import { Button, Container, Text, useToast, Box, VStack, HStack } from 'native-base'
import auth from '@react-native-firebase/auth'
import { useQuery } from '@tanstack/react-query'
import { getUserData, getUserSettings } from '../services/database'
import { iapService } from '../services/iap'
import { markPaymentFlowCompleted } from '../services/subscription'
import TabScreen from '../components/TabScreen'

const Profile = () => {
  const { reset, navigate } = useNavigation()
  const isFocused = useIsFocused()
  const toast = useToast()
  const user = auth().currentUser
  const [isRestoring, setIsRestoring] = useState(false)

  const { data: profile, isLoading: profileLoading } = useQuery(
    ['profile'],
    getUserData
  )

  const { data: userSettings } = useQuery(['settings'], getUserSettings)
  const currentSubscription = userSettings?.subscription

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

  useEffect(() => {
    if (isFocused) {
      StatusBar.setBarStyle('dark-content', true)
    }
  }, [isFocused])

  if (profileLoading) return <></>

  const handleSubscriptionPress = () => {
    navigate('Subscription')
  }

  return (
    <TabScreen>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F3F6' }}>
        <Container flex="1" px="20px" mt="16px" mb="80px" w="100%" minW="100%">
          <VStack space="6" flex="1">
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
      </SafeAreaView>
    </TabScreen>
  )
}

export default Profile
