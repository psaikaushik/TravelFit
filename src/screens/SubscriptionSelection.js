import React, { useState } from 'react'
import { SafeAreaView, StatusBar, ScrollView } from 'react-native'
import {
  Container,
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
import { subscriptionService, SUBSCRIPTION_PLANS, formatPrice, markPaymentFlowCompleted } from '../services/subscription'
import { getUserSettings, setUserSettings } from '../services/database'
import TabScreen from '../components/TabScreen'

const SubscriptionSelection = () => {
  const { navigate, reset } = useNavigation()
  const toast = useToast()
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Get available products
  const { data: products, isLoading: productsLoading } = useQuery(
    ['subscription-products'],
    () => subscriptionService.getProducts(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3
    }
  )

  const handleSubscriptionPurchase = async () => {
    if (!selectedPlan) {
      toast.show({
        status: 'error',
        description: 'Please select a plan first'
      })
      return
    }

    setIsProcessing(true)
    try {
      const result = await subscriptionService.purchaseSubscription(selectedPlan)
      
             if (result.success) {
         // Mark payment flow as completed
         await markPaymentFlowCompleted()
         
         toast.show({
           status: 'success',
           description: 'Subscription activated successfully!'
         })
         // Navigate to main app
         reset({
           index: 0,
           routes: [{ name: 'Main' }]
         })
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
      setIsProcessing(false)
    }
  }

  const handleFreeTrial = async () => {
    try {
      // Set user settings to indicate they're on free trial
      const userSettings = await getUserSettings() || {}
      await setUserSettings({
        ...userSettings,
        freeTrial: {
          isActive: true,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        }
      })

      // Mark payment flow as completed
      await markPaymentFlowCompleted()

      toast.show({
        status: 'success',
        description: 'Free trial activated! Enjoy 7 days of premium features.'
      })

      // Navigate to main app
      reset({
        index: 0,
        routes: [{ name: 'Main' }]
      })
    } catch (error) {
      console.error('Free trial error:', error)
      toast.show({
        status: 'error',
        description: 'Failed to activate free trial'
      })
    }
  }

  const getProductPrice = (productId) => {
    const product = products?.find(p => p.productId === productId)
    // Use fallback pricing if products aren't loaded from App Store yet
    return product ? formatPrice(product) : SUBSCRIPTION_PLANS[productId]?.price || '$4.99'
  }

  if (productsLoading) {
    return (
      <TabScreen>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F3F6' }}>
          <Container flex="1" justifyContent="center" alignItems="center">
            <Text fontSize="16">Loading subscription plans...</Text>
          </Container>
        </SafeAreaView>
      </TabScreen>
    )
  }

  // Show development mode notice if no products are loaded
  const isDevelopmentMode = !products || products.length === 0

  return (
    <TabScreen>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F3F6' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#F3F3F6" />
        <ScrollView style={{ flex: 1 }}>
          <Container flex="1" px="20px" py="20px" w="100%" minW="100%">
            <VStack space="6" flex="1">
              {/* Header */}
              <VStack space="4" alignItems="center">
                <Text fontSize="28px" fontWeight="bold" textAlign="center">
                  Choose Your Plan
                </Text>
                <Text fontSize="16px" textAlign="center" color="gray.600">
                  Select the plan that works best for your fitness journey
                </Text>
              </VStack>

              {/* Development Mode Notice */}
              {isDevelopmentMode && (
                <Box bg="yellow.50" borderRadius="12" p="4" borderWidth="1" borderColor="yellow.200">
                  <HStack space="3" alignItems="center">
                    <Text fontSize="16px" color="yellow.600">⚠️</Text>
                    <VStack flex="1">
                      <Text fontSize="14px" fontWeight="600" color="yellow.800">
                        Development Mode
                      </Text>
                      <Text fontSize="12px" color="yellow.700">
                        Products not configured in App Store Connect. Using fallback pricing for testing.
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              )}

              {/* Subscription Plans */}
              <VStack space="4">
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

              {/* Divider */}
              <HStack alignItems="center" space="4">
                <Divider flex="1" />
                <Text fontSize="14px" color="gray.500">OR</Text>
                <Divider flex="1" />
              </HStack>

              {/* Free Trial Option */}
              <Box bg="green.50" borderRadius="16" p="6" borderWidth="1" borderColor="green.200">
                <VStack space="4">
                  <HStack justifyContent="space-between" alignItems="center">
                    <VStack flex="1">
                      <Text fontSize="20px" fontWeight="600" color="green.800">
                        Free Trial
                      </Text>
                      <Text fontSize="14px" color="green.700">
                        Try all premium features for 7 days
                      </Text>
                    </VStack>
                    <Box bg="green.500" px="3" py="1" borderRadius="full">
                      <Text fontSize="12px" fontWeight="600" color="white">
                        FREE
                      </Text>
                    </Box>
                  </HStack>

                  <VStack space="2">
                    <Text fontSize="14px" color="green.700" fontWeight="500">
                      What's included:
                    </Text>
                    <Text fontSize="12px" color="green.600">
                      • All premium features for 7 days
                    </Text>
                    <Text fontSize="12px" color="green.600">
                      • No credit card required
                    </Text>
                    <Text fontSize="12px" color="green.600">
                      • Cancel anytime
                    </Text>
                  </VStack>

                  <Button
                    colorScheme="green"
                    variant="outline"
                    onPress={handleFreeTrial}
                  >
                    Start Free Trial
                  </Button>
                </VStack>
              </Box>

              {/* Features List */}
              <Box bg="white" borderRadius="16" p="6">
                <Text fontSize="18px" fontWeight="600" mb="4">
                  All Plans Include
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
                {selectedPlan && (
                  <Button
                    size="lg"
                    colorScheme="blue"
                    onPress={handleSubscriptionPurchase}
                    isLoading={isProcessing}
                    isDisabled={isProcessing}
                  >
                    {isProcessing 
                      ? 'Processing...' 
                      : isDevelopmentMode 
                        ? `Test Subscription - ${getProductPrice(selectedPlan)}`
                        : `Subscribe Now - ${getProductPrice(selectedPlan)}`
                    }
                  </Button>
                )}
              </VStack>

              {/* Terms */}
              <Text fontSize="12px" color="gray.500" textAlign="center">
                Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period.
              </Text>
            </VStack>
          </Container>
        </ScrollView>
      </SafeAreaView>
    </TabScreen>
  )
}

export default SubscriptionSelection 