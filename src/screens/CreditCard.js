import React, { useState, useEffect } from 'react'
import { SafeAreaView, StatusBar, ScrollView, Platform } from 'react-native'
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
import {
  CardField,
  useStripe,
  useApplePay,
  ApplePayButton
} from '@stripe/stripe-react-native'
import TabScreen from '../components/TabScreen'
import { createStripeCustomer, createSetupIntent } from '../services/api'
import { markPaymentFlowCompleted } from '../services/subscription'
import auth from '@react-native-firebase/auth'
import { getProfile } from '../services/users'

const CreditCard = () => {
  const { navigate } = useNavigation()
  const toast = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardComplete, setCardComplete] = useState(false)
  const [isApplePayAvailable, setIsApplePayAvailable] = useState(false)

  const { confirmSetupIntent } = useStripe()
  const { isApplePaySupported, presentApplePay, confirmApplePayPayment } = useApplePay()

  useEffect(() => {
    ensureStripeCustomer()
    if (Platform.OS === 'ios') {
      checkApplePayAvailability()
    }
  }, [])

  const ensureStripeCustomer = async () => {
    try {
      const user = auth().currentUser
      const profile = await getProfile()
      await createStripeCustomer(
        user?.email || profile?.email,
        profile?.name || user?.displayName
      )
    } catch (error) {
      console.log('Customer may already exist:', error)
    }
  }

  const checkApplePayAvailability = async () => {
    try {
      const supported = await isApplePaySupported()
      setIsApplePayAvailable(supported)
    } catch (error) {
      console.log('Apple Pay not available:', error)
      setIsApplePayAvailable(false)
    }
  }

  const handleApplePay = async () => {
    setIsProcessing(true)
    try {
      // Get a real SetupIntent from our backend
      const { clientSecret } = await createSetupIntent()

      // Present Apple Pay sheet
      const { error: presentError } = await presentApplePay({
        cartItems: [{ label: 'TravelFit', amount: '0.00', paymentType: 'Immediate' }],
        country: 'US',
        currency: 'USD'
      })

      if (presentError) {
        throw presentError
      }

      // Confirm the SetupIntent with Apple Pay
      const { error: confirmError } = await confirmApplePayPayment(clientSecret)

      if (confirmError) {
        throw confirmError
      }

      toast.show({
        status: 'success',
        description: 'Card saved via Apple Pay!'
      })

      await markPaymentFlowCompleted()
      navigate('SubscriptionSelection')
    } catch (error) {
      console.error('Apple Pay error:', error)
      if (error.code !== 'Canceled') {
        toast.show({
          status: 'error',
          description: 'Apple Pay failed. Please try entering your card manually.'
        })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCardSubmit = async () => {
    if (!cardComplete) return

    setIsProcessing(true)
    try {
      // Get a real SetupIntent from our backend
      const { clientSecret } = await createSetupIntent()

      // Confirm with the card details collected by CardField
      const { error, setupIntent } = await confirmSetupIntent(clientSecret, {
        paymentMethodType: 'Card'
      })

      if (error) {
        throw error
      }

      if (setupIntent.status === 'Succeeded') {
        toast.show({
          status: 'success',
          description: 'Card saved successfully!'
        })

        await markPaymentFlowCompleted()
        navigate('SubscriptionSelection')
      }
    } catch (error) {
      console.error('Card setup error:', error)
      toast.show({
        status: 'error',
        description: error.localizedMessage || error.message || 'Failed to save card. Please try again.'
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
                <Text fontSize="28px" fontWeight="bold" textAlign="center" accessibilityRole="header">
                  Payment Information
                </Text>
                <Text fontSize="16px" textAlign="center" color="gray.600" accessibilityLabel="Add a payment method to start your 3 day free trial">
                  Add a payment method to start your 3-day free trial
                </Text>
                <Box bg="green.50" borderRadius="12" p="3" w="100%">
                  <Text fontSize="14px" textAlign="center" color="green.700" fontWeight="500">
                    You won't be charged during your 3-day trial
                  </Text>
                </Box>
              </VStack>

              {/* Apple Pay Option */}
              {isApplePayAvailable && (
                <Box bg="white" borderRadius="16" p="6">
                  <VStack space="4">
                    <VStack>
                      <Text fontSize="18px" fontWeight="600">
                        Apple Pay
                      </Text>
                      <Text fontSize="14px" color="gray.600">
                        Fast and secure with Face ID or Touch ID
                      </Text>
                    </VStack>

                    <ApplePayButton
                      onPress={handleApplePay}
                      type="setUp"
                      buttonStyle="black"
                      borderRadius={12}
                      style={{ width: '100%', height: 50 }}
                      disabled={isProcessing}
                    />
                  </VStack>
                </Box>
              )}

              {/* Divider */}
              {isApplePayAvailable && (
                <HStack alignItems="center" space="4">
                  <Divider flex="1" />
                  <Text fontSize="14px" color="gray.500">OR</Text>
                  <Divider flex="1" />
                </HStack>
              )}

              {/* Credit Card Form — Stripe CardField (PCI compliant) */}
              <Box bg="white" borderRadius="16" p="6">
                <VStack space="6">
                  <VStack>
                    <Text fontSize="18px" fontWeight="600">
                      Credit or Debit Card
                    </Text>
                    <Text fontSize="14px" color="gray.600">
                      Your card will be charged after the trial ends
                    </Text>
                  </VStack>

                  <CardField
                    postalCodeEnabled={false}
                    placeholders={{ number: '4242 4242 4242 4242' }}
                    cardStyle={{
                      backgroundColor: '#F7F7F7',
                      textColor: '#1a1a1a',
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      borderRadius: 8,
                      fontSize: 16,
                      placeholderColor: '#A0AEC0'
                    }}
                    style={{ width: '100%', height: 50, marginVertical: 8 }}
                    onCardChange={(details) => {
                      setCardComplete(details.complete)
                    }}
                  />

                  <Button
                    size="lg"
                    colorScheme="blue"
                    onPress={handleCardSubmit}
                    isLoading={isProcessing}
                    isDisabled={!cardComplete || isProcessing}
                    borderRadius="12"
                    height="50px"
                    accessibilityLabel={isProcessing ? 'Saving card' : 'Continue with card'}
                  >
                    {isProcessing ? 'Saving...' : 'Continue with Card'}
                  </Button>
                </VStack>
              </Box>

              {/* Security Notice */}
              <Box bg="blue.50" borderRadius="12" p="4">
                <HStack space="3" alignItems="center">
                  <Text fontSize="16px" color="blue.600">🔒</Text>
                  <VStack flex="1">
                    <Text fontSize="14px" fontWeight="600" color="blue.800">
                      Secure Payment
                    </Text>
                    <Text fontSize="12px" color="blue.700">
                      Card details are handled securely by Stripe. We never see or store your full card number.
                    </Text>
                  </VStack>
                </HStack>
              </Box>

              {/* Terms */}
              <Text fontSize="12px" color="gray.500" textAlign="center">
                By continuing, you agree to our Terms of Service and Privacy Policy.
                Your 3-day free trial starts when you choose a plan. You can cancel anytime before the trial ends.
              </Text>
            </VStack>
          </Container>
        </ScrollView>
      </SafeAreaView>
    </TabScreen>
  )
}

export default CreditCard
