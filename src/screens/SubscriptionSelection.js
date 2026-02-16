import React, { useState } from 'react'
import { SafeAreaView, StatusBar, ScrollView } from 'react-native'
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
import { createSubscription } from '../services/api'
import { markPaymentFlowCompleted } from '../services/subscription'
import { STRIPE_PRICES, isTestMode } from '../config/stripe'
import TabScreen from '../components/TabScreen'

const SubscriptionSelection = () => {
  const { reset } = useNavigation()
  const toast = useToast()
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const plans = [
    {
      key: 'annual',
      priceId: STRIPE_PRICES.annual.id,
      title: STRIPE_PRICES.annual.label,
      price: STRIPE_PRICES.annual.display,
      period: 'per year',
      description: 'Full access to all TravelFit features',
      savings: STRIPE_PRICES.annual.savings
    },
    {
      key: 'monthly',
      priceId: STRIPE_PRICES.monthly.id,
      title: STRIPE_PRICES.monthly.label,
      price: STRIPE_PRICES.monthly.display,
      period: 'per month',
      description: 'Full access to all TravelFit features',
      savings: null
    }
  ]

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      toast.show({ status: 'error', description: 'Please select a plan' })
      return
    }

    const plan = plans.find((p) => p.key === selectedPlan)
    setIsProcessing(true)

    try {
      // Create Stripe subscription with 3-day trial via Cloud Function
      const result = await createSubscription(plan.priceId)

      await markPaymentFlowCompleted()

      const trialEndDate = result.trialEnd
        ? new Date(result.trialEnd).toLocaleDateString()
        : null

      toast.show({
        status: 'success',
        description: trialEndDate
          ? `Trial started! You won't be charged until ${trialEndDate}.`
          : 'Subscription activated!'
      })

      reset({
        index: 0,
        routes: [{ name: 'Main' }]
      })
    } catch (error) {
      console.error('Subscription error:', error)
      toast.show({
        status: 'error',
        description: error.message || 'Failed to start subscription. Please try again.'
      })
    } finally {
      setIsProcessing(false)
    }
  }

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
                  All plans include a 3-day free trial
                </Text>
              </VStack>

              {/* Trial Banner */}
              <Box bg="green.50" borderRadius="12" p="4" borderWidth="1" borderColor="green.200">
                <VStack space="1" alignItems="center">
                  <Text fontSize="16px" fontWeight="600" color="green.800">
                    3-Day Free Trial
                  </Text>
                  <Text fontSize="13px" color="green.700" textAlign="center">
                    Try everything free for 3 days. Cancel anytime before the trial ends and you won't be charged.
                  </Text>
                </VStack>
              </Box>

              {/* Test Mode Notice */}
              {isTestMode() && (
                <Box bg="yellow.50" borderRadius="12" p="4" borderWidth="1" borderColor="yellow.200">
                  <HStack space="3" alignItems="center">
                    <VStack flex="1">
                      <Text fontSize="14px" fontWeight="600" color="yellow.800">
                        Test Mode
                      </Text>
                      <Text fontSize="12px" color="yellow.700">
                        Using test Stripe keys. No real charges will be made.
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              )}

              {/* Plan Cards */}
              <VStack space="4">
                {plans.map((plan) => (
                  <Box
                    key={plan.key}
                    bg={selectedPlan === plan.key ? 'blue.50' : 'white'}
                    borderWidth={selectedPlan === plan.key ? 2 : 1}
                    borderColor={selectedPlan === plan.key ? 'blue.500' : 'gray.200'}
                    borderRadius="16"
                    p="6"
                    position="relative"
                  >
                    {plan.savings && (
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
                          {plan.savings}
                        </Text>
                      </Box>
                    )}

                    <HStack justifyContent="space-between" alignItems="center" mb="4">
                      <VStack flex="1">
                        <Text fontSize="20px" fontWeight="600">
                          {plan.title}
                        </Text>
                        <Text fontSize="14px" color="gray.600">
                          {plan.description}
                        </Text>
                      </VStack>
                      <VStack alignItems="flex-end">
                        <Text fontSize="24px" fontWeight="bold" color="blue.600">
                          {plan.price}
                        </Text>
                        <Text fontSize="14px" color="gray.500">
                          {plan.period}
                        </Text>
                      </VStack>
                    </HStack>

                    <Button
                      variant={selectedPlan === plan.key ? 'solid' : 'outline'}
                      colorScheme="blue"
                      onPress={() => setSelectedPlan(plan.key)}
                    >
                      {selectedPlan === plan.key ? 'Selected' : `Select ${plan.title}`}
                    </Button>
                  </Box>
                ))}
              </VStack>

              {/* Features List */}
              <Box bg="white" borderRadius="16" p="6">
                <Text fontSize="18px" fontWeight="600" mb="4">
                  All Plans Include
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

              {/* Subscribe Button */}
              {selectedPlan && (
                <Button
                  size="lg"
                  colorScheme="blue"
                  onPress={handleSubscribe}
                  isLoading={isProcessing}
                  isDisabled={isProcessing}
                  borderRadius="12"
                  height="54px"
                >
                  {isProcessing
                    ? 'Starting trial...'
                    : `Start Free Trial — then ${plans.find((p) => p.key === selectedPlan)?.price}/${plans.find((p) => p.key === selectedPlan)?.period.replace('per ', '')}`
                  }
                </Button>
              )}

              {/* Terms */}
              <Text fontSize="12px" color="gray.500" textAlign="center">
                After your 3-day free trial, your subscription will automatically renew
                at the selected price unless cancelled at least 24 hours before the trial ends.
              </Text>
            </VStack>
          </Container>
        </ScrollView>
      </SafeAreaView>
    </TabScreen>
  )
}

export default SubscriptionSelection
