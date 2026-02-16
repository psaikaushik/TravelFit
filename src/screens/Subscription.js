import React, { useState } from 'react'
import {
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator
} from 'react-native'
import {
  Container,
  Text,
  Button,
  useToast,
  Box,
  VStack,
  HStack
} from 'native-base'
import { useNavigation } from '@react-navigation/native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getSubscriptionStatus,
  cancelSubscription as cancelSubscriptionApi
} from '../services/api'
import { STRIPE_PRICES } from '../config/stripe'
import TabScreen from '../components/TabScreen'

const Subscription = () => {
  const { goBack } = useNavigation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [isCancelling, setIsCancelling] = useState(false)

  const { data: subStatus, isLoading } = useQuery(
    ['subscription-status'],
    () => getSubscriptionStatus(),
    { staleTime: 30 * 1000 }
  )

  const subscription = subStatus?.subscription
  const isSubscribed = subStatus?.isSubscribed
  const isInTrial = subStatus?.isInTrial

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      await cancelSubscriptionApi()
      queryClient.invalidateQueries(['subscription-status'])
      toast.show({
        status: 'success',
        description: 'Subscription will cancel at the end of your current period.'
      })
    } catch (error) {
      console.error('Cancel error:', error)
      toast.show({
        status: 'error',
        description: 'Failed to cancel subscription. Please try again.'
      })
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return (
      <TabScreen>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F3F6' }}>
          <Container flex="1" justifyContent="center" alignItems="center">
            <ActivityIndicator size="large" color="#007AFF" />
            <Text mt="4" fontSize="16">Loading subscription...</Text>
          </Container>
        </SafeAreaView>
      </TabScreen>
    )
  }

  return (
    <TabScreen>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F3F6' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#F3F3F6" />
        <ScrollView style={{ flex: 1 }}>
          <Container flex="1" px="20px" py="20px" w="100%" minW="100%">
            <VStack space="4" mb="8">
              <Text fontSize="28px" fontWeight="bold" textAlign="center">
                Your Subscription
              </Text>
            </VStack>

            {/* Current Status */}
            {isSubscribed ? (
              <Box bg="green.100" p="4" borderRadius="12" mb="6">
                <VStack space="2" alignItems="center">
                  <Text fontSize="16px" fontWeight="600" color="green.800">
                    {isInTrial ? 'Free Trial Active' : 'Premium Active'}
                  </Text>
                  {isInTrial && subscription?.trialEnd && (
                    <Text fontSize="14px" color="green.700" textAlign="center">
                      Trial ends {new Date(subscription.trialEnd).toLocaleDateString()}.
                      You'll be charged after that.
                    </Text>
                  )}
                  {subscription?.cancelAtPeriodEnd && (
                    <Text fontSize="14px" color="orange.700" textAlign="center">
                      Cancels on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </Text>
                  )}
                </VStack>
              </Box>
            ) : (
              <Box bg="gray.100" p="4" borderRadius="12" mb="6">
                <Text fontSize="16px" fontWeight="600" color="gray.800" textAlign="center">
                  No active subscription
                </Text>
                {subscription?.paymentFailed && (
                  <Text fontSize="14px" color="red.600" textAlign="center" mt="2">
                    Your last payment failed. Please update your payment method.
                  </Text>
                )}
              </Box>
            )}

            {/* Plan Details */}
            {subscription?.priceId && (
              <Box bg="white" borderRadius="16" p="6" mb="6">
                <Text fontSize="18px" fontWeight="600" mb="2">
                  Plan Details
                </Text>
                <VStack space="2">
                  <HStack justifyContent="space-between">
                    <Text color="gray.600">Plan</Text>
                    <Text fontWeight="500">
                      {subscription.priceId === STRIPE_PRICES.annual.id
                        ? STRIPE_PRICES.annual.label
                        : STRIPE_PRICES.monthly.label}
                    </Text>
                  </HStack>
                  <HStack justifyContent="space-between">
                    <Text color="gray.600">Price</Text>
                    <Text fontWeight="500">
                      {subscription.priceId === STRIPE_PRICES.annual.id
                        ? `${STRIPE_PRICES.annual.display}/year`
                        : `${STRIPE_PRICES.monthly.display}/month`}
                    </Text>
                  </HStack>
                  <HStack justifyContent="space-between">
                    <Text color="gray.600">Status</Text>
                    <Text fontWeight="500" color={isSubscribed ? 'green.600' : 'red.600'}>
                      {subscription.status?.charAt(0).toUpperCase() + subscription.status?.slice(1)}
                    </Text>
                  </HStack>
                  {subscription?.currentPeriodEnd && (
                    <HStack justifyContent="space-between">
                      <Text color="gray.600">
                        {subscription.cancelAtPeriodEnd ? 'Access until' : 'Renews on'}
                      </Text>
                      <Text fontWeight="500">
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </Box>
            )}

            {/* Features */}
            <Box bg="white" borderRadius="16" p="6" mb="6">
              <Text fontSize="18px" fontWeight="600" mb="4">
                Premium Features
              </Text>
              <VStack space="3">
                {[
                  'Unlimited routes and journeys',
                  'Advanced progress analytics',
                  'Custom achievement badges',
                  'Route history and replays',
                  'Priority customer support'
                ].map((feature) => (
                  <HStack key={feature} space="3" alignItems="center">
                    <Text fontSize="16px" color="green.600">✓</Text>
                    <Text fontSize="16px">{feature}</Text>
                  </HStack>
                ))}
              </VStack>
            </Box>

            {/* Action Buttons */}
            <VStack space="4">
              {isSubscribed && !subscription?.cancelAtPeriodEnd && (
                <Button
                  size="lg"
                  variant="outline"
                  colorScheme="red"
                  onPress={handleCancel}
                  isLoading={isCancelling}
                >
                  Cancel Subscription
                </Button>
              )}

              <Button
                size="lg"
                variant="ghost"
                colorScheme="gray"
                onPress={goBack}
              >
                Done
              </Button>
            </VStack>

            <Text fontSize="12px" color="gray.500" textAlign="center" mt="6">
              Subscription management is handled through Stripe.
              For billing questions, contact support.
            </Text>
          </Container>
        </ScrollView>
      </SafeAreaView>
    </TabScreen>
  )
}

export default Subscription
