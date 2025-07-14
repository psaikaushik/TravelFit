import React, { useEffect, useState } from 'react'
import {
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native'
import {
  Container,
  Flex,
  Text,
  Button,
  useToast,
  Box,
  VStack,
  HStack,
  Divider
} from 'native-base'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { subscriptionService, SUBSCRIPTION_PLANS, formatPrice } from '../services/subscription'
import { getUserSettings } from '../services/database'
import TabScreen from '../components/TabScreen'

const Subscription = () => {
  const { goBack } = useNavigation()
  const toast = useToast()
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [isPurchasing, setIsPurchasing] = useState(false)

  // Get current subscription status
  const { data: userSettings } = useQuery(['settings'], getUserSettings)
  const currentSubscription = userSettings?.subscription

  // Get available products
  const { data: products, isLoading: productsLoading } = useQuery(
    ['subscription-products'],
    () => subscriptionService.getProducts(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3
    }
  )

  useEffect(() => {
    StatusBar.setBarStyle('dark-content', true)
  }, [])

  const handlePurchase = async () => {
    if (!selectedPlan) {
      toast.show({
        status: 'error',
        description: 'Please select a plan first'
      })
      return
    }

    setIsPurchasing(true)
    try {
      const result = await subscriptionService.purchaseSubscription(selectedPlan)
      
      if (result.success) {
        toast.show({
          status: 'success',
          description: 'Subscription purchased successfully!'
        })
        goBack()
      } else {
        toast.show({
          status: 'error',
          description: result.error || 'Purchase failed'
        })
      }
    } catch (error) {
      console.error('Purchase error:', error)
      toast.show({
        status: 'error',
        description: 'Purchase failed. Please try again.'
      })
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleRestorePurchases = async () => {
    try {
      const result = await subscriptionService.restorePurchases()
      
      if (result.success) {
        toast.show({
          status: 'success',
          description: 'Purchases restored successfully!'
        })
        goBack()
      } else {
        toast.show({
          status: 'error',
          description: result.error || 'No purchases found to restore'
        })
      }
    } catch (error) {
      console.error('Restore error:', error)
      toast.show({
        status: 'error',
        description: 'Failed to restore purchases'
      })
    }
  }

  const getProductPrice = (productId) => {
    const product = products?.find(p => p.productId === productId)
    return product ? formatPrice(product) : SUBSCRIPTION_PLANS[productId]?.price
  }

  const isSubscribed = currentSubscription?.isSubscribed

  if (productsLoading) {
    return (
      <TabScreen>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F3F6' }}>
          <Container flex="1" justifyContent="center" alignItems="center">
            <ActivityIndicator size="large" color="#007AFF" />
            <Text mt="4" fontSize="16">Loading subscription plans...</Text>
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
            {/* Header */}
            <VStack space="4" mb="8">
              <Text fontSize="28px" fontWeight="bold" textAlign="center">
                Upgrade to Premium
              </Text>
              <Text fontSize="16px" textAlign="center" color="gray.600">
                Unlock all TravelFit features and take your fitness journey to the next level
              </Text>
            </VStack>

            {/* Current Subscription Status */}
            {isSubscribed && (
              <Box bg="green.100" p="4" borderRadius="12" mb="6">
                <Text fontSize="16px" fontWeight="600" color="green.800" textAlign="center">
                  ✅ You're currently subscribed to Premium!
                </Text>
                <Text fontSize="14px" color="green.700" textAlign="center" mt="2">
                  Enjoy all premium features
                </Text>
              </Box>
            )}

            {/* Subscription Plans */}
            <VStack space="4" mb="8">
              {/* Annual Plan */}
              <Box
                bg={selectedPlan === 'travelfit_annual_subscription' ? 'blue.50' : 'white'}
                borderWidth={selectedPlan === 'travelfit_annual_subscription' ? 2 : 1}
                borderColor={selectedPlan === 'travelfit_annual_subscription' ? 'blue.500' : 'gray.200'}
                borderRadius="16"
                p="6"
                position="relative"
              >
                {SUBSCRIPTION_PLANS['travelfit_annual_subscription'].savings && (
                  <Box
                    position="absolute"
                    top="-8"
                    right="4"
                    bg="green.500"
                    px="3"
                    py="1"
                    borderRadius="full"
                  >
                    <Text fontSize="12px" fontWeight="600" color="white">
                      {SUBSCRIPTION_PLANS['travelfit_annual_subscription'].savings}
                    </Text>
                  </Box>
                )}
                
                <HStack justifyContent="space-between" alignItems="center" mb="4">
                  <VStack flex="1">
                    <Text fontSize="20px" fontWeight="600">
                      {SUBSCRIPTION_PLANS['travelfit_annual_subscription'].title}
                    </Text>
                    <Text fontSize="14px" color="gray.600">
                      {SUBSCRIPTION_PLANS['travelfit_annual_subscription'].description}
                    </Text>
                  </VStack>
                  <VStack alignItems="flex-end">
                    <Text fontSize="24px" fontWeight="bold" color="blue.600">
                      {getProductPrice('travelfit_annual_subscription')}
                    </Text>
                    <Text fontSize="14px" color="gray.500">
                      per year
                    </Text>
                  </VStack>
                </HStack>

                <Button
                  variant={selectedPlan === 'travelfit_annual_subscription' ? 'solid' : 'outline'}
                  colorScheme="blue"
                  onPress={() => setSelectedPlan('travelfit_annual_subscription')}
                >
                  {selectedPlan === 'travelfit_annual_subscription' ? 'Selected' : 'Select Annual'}
                </Button>
              </Box>

              {/* Monthly Plan */}
              <Box
                bg={selectedPlan === 'travelfit_monthly_subscription' ? 'blue.50' : 'white'}
                borderWidth={selectedPlan === 'travelfit_monthly_subscription' ? 2 : 1}
                borderColor={selectedPlan === 'travelfit_monthly_subscription' ? 'blue.500' : 'gray.200'}
                borderRadius="16"
                p="6"
              >
                <HStack justifyContent="space-between" alignItems="center" mb="4">
                  <VStack flex="1">
                    <Text fontSize="20px" fontWeight="600">
                      {SUBSCRIPTION_PLANS['travelfit_monthly_subscription'].title}
                    </Text>
                    <Text fontSize="14px" color="gray.600">
                      {SUBSCRIPTION_PLANS['travelfit_monthly_subscription'].description}
                    </Text>
                  </VStack>
                  <VStack alignItems="flex-end">
                    <Text fontSize="24px" fontWeight="bold" color="blue.600">
                      {getProductPrice('travelfit_monthly_subscription')}
                    </Text>
                    <Text fontSize="14px" color="gray.500">
                      per month
                    </Text>
                  </VStack>
                </HStack>

                <Button
                  variant={selectedPlan === 'travelfit_monthly_subscription' ? 'solid' : 'outline'}
                  colorScheme="blue"
                  onPress={() => setSelectedPlan('travelfit_monthly_subscription')}
                >
                  {selectedPlan === 'travelfit_monthly_subscription' ? 'Selected' : 'Select Monthly'}
                </Button>
              </Box>
            </VStack>

            {/* Features List */}
            <Box bg="white" borderRadius="16" p="6" mb="6">
              <Text fontSize="18px" fontWeight="600" mb="4">
                Premium Features
              </Text>
              <VStack space="3">
                <HStack space="3" alignItems="center">
                  <Text fontSize="16px" color="green.600">✓</Text>
                  <Text fontSize="16px">Unlimited routes and journeys</Text>
                </HStack>
                <HStack space="3" alignItems="center">
                  <Text fontSize="16px" color="green.600">✓</Text>
                  <Text fontSize="16px">Advanced progress analytics</Text>
                </HStack>
                <HStack space="3" alignItems="center">
                  <Text fontSize="16px" color="green.600">✓</Text>
                  <Text fontSize="16px">Custom achievement badges</Text>
                </HStack>
                <HStack space="3" alignItems="center">
                  <Text fontSize="16px" color="green.600">✓</Text>
                  <Text fontSize="16px">Route history and replays</Text>
                </HStack>
                <HStack space="3" alignItems="center">
                  <Text fontSize="16px" color="green.600">✓</Text>
                  <Text fontSize="16px">Priority customer support</Text>
                </HStack>
              </VStack>
            </Box>

            {/* Action Buttons */}
            <VStack space="4">
              {!isSubscribed && (
                <Button
                  size="lg"
                  colorScheme="blue"
                  onPress={handlePurchase}
                  isLoading={isPurchasing}
                  isDisabled={!selectedPlan || isPurchasing}
                >
                  {isPurchasing ? 'Processing...' : 'Subscribe Now'}
                </Button>
              )}

              <Button
                size="lg"
                variant="outline"
                colorScheme="gray"
                onPress={handleRestorePurchases}
              >
                Restore Purchases
              </Button>

              <Button
                size="lg"
                variant="ghost"
                colorScheme="gray"
                onPress={goBack}
              >
                Cancel
              </Button>
            </VStack>

            {/* Terms */}
            <Text fontSize="12px" color="gray.500" textAlign="center" mt="6">
              Subscription will automatically renew unless cancelled at least 24 hours before the end of the current period.
            </Text>
          </Container>
        </ScrollView>
      </SafeAreaView>
    </TabScreen>
  )
}

export default Subscription 