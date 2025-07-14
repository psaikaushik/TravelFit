import React, { useEffect } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { SafeAreaView, StatusBar } from 'react-native'
import { Button, Container, Flex, Text, useToast, Box, VStack, HStack } from 'native-base'
import auth from '@react-native-firebase/auth'
import { useQuery } from '@tanstack/react-query'
import { getUserData, getUserSettings } from '../services/database'
import { subscriptionService } from '../services/subscription'
import TabScreen from '../components/TabScreen'
import { hasNotch } from 'react-native-device-info'

const Profile = () => {
  const { reset, navigate } = useNavigation()
  const isFocused = useIsFocused()
  const toast = useToast()
  const user = auth().currentUser
  const isIphoneX = hasNotch()

  const { data: profile, isLoading: profileLoading } = useQuery(
    ['profile'],
    getUserData
  )

  const { data: userSettings } = useQuery(['settings'], getUserSettings)
  const currentSubscription = userSettings?.subscription

  console.log('profile', profile)

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
            <Box bg="secondary.400" borderRadius="16px" py="30px" px="20px">
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
                    <Text fontSize="12px" color="gray.500">
                      Enjoy all premium features
                    </Text>
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
                    >
                      Upgrade Now
                    </Button>
                  </VStack>
                )}
              </VStack>
            </Box>

            {/* Sign Out Button */}
            <Button size="lg" variant="primary" onPress={handleLogOut}>
              Sign Out
            </Button>
          </VStack>
        </Container>
      </SafeAreaView>
    </TabScreen>
  )
}

export default Profile
