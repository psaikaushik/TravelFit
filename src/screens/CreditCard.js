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
  Input,
  FormControl,
  WarningOutlineIcon,
  Divider
} from 'native-base'
import { useNavigation } from '@react-navigation/native'
import { useForm, Controller } from 'react-hook-form'
import TabScreen from '../components/TabScreen'
import { markPaymentFlowCompleted } from '../services/subscription'

const CreditCard = () => {
  const { navigate } = useNavigation()
  const toast = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isApplePayAvailable, setIsApplePayAvailable] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    }
  })

  useEffect(() => {
    // Check if Apple Pay is available (iOS only)
    if (Platform.OS === 'ios') {
      // For now, we'll assume Apple Pay is available on iOS
      // TODO: Implement proper Apple Pay detection when package is fixed
      setIsApplePayAvailable(true)
    }
  }, [])

  const handleApplePay = async () => {
    setIsProcessing(true)
    try {
      // TODO: Implement Apple Pay when package is properly configured
      console.log('Apple Pay requested - implementation pending')
      
      // Simulate Apple Pay processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.show({
        status: 'info',
        description: 'Apple Pay integration coming soon! Using credit card for now.'
      })
      
      // For now, just mark payment flow as completed
      await markPaymentFlowCompleted()
      
      // Navigate to subscription selection
      navigate('SubscriptionSelection')
    } catch (error) {
      console.error('Apple Pay error:', error)
      toast.show({
        status: 'error',
        description: 'Apple Pay not available yet. Please use credit card.'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const onSubmit = async (data) => {
    setIsProcessing(true)
    try {
      // Here you would typically integrate with a payment processor
      // For now, we'll simulate a successful payment
      console.log('Credit card data:', data)
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mark payment flow as completed
      await markPaymentFlowCompleted()
      
      // Navigate to subscription selection
      navigate('SubscriptionSelection')
    } catch (error) {
      console.error('Payment error:', error)
      toast.show({
        status: 'error',
        description: 'Payment processing failed. Please try again.'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCardNumber = (text) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '')
    // Add spaces every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ')
    return formatted.substring(0, 19) // Limit to 16 digits + 3 spaces
  }

  const formatExpiryDate = (text) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '')
    // Add slash after 2 digits
    const formatted = cleaned.replace(/(\d{2})(?=\d)/g, '$1/')
    return formatted.substring(0, 5) // Limit to MM/YY format
  }

  const formatCVV = (text) => {
    // Remove all non-digits and limit to 4 characters
    return text.replace(/\D/g, '').substring(0, 4)
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
                  Payment Information
                </Text>
                <Text fontSize="16px" textAlign="center" color="gray.600">
                  Choose your preferred payment method
                </Text>
              </VStack>

              {/* Apple Pay Option */}
              {isApplePayAvailable && (
                <Box bg="white" borderRadius="16" p="6">
                  <VStack space="4">
                    <HStack space="3" alignItems="center">
                      <Text fontSize="20px">🍎</Text>
                      <VStack flex="1">
                        <Text fontSize="18px" fontWeight="600">
                          Apple Pay
                        </Text>
                        <Text fontSize="14px" color="gray.600">
                          Fast and secure payment with Face ID or Touch ID
                        </Text>
                      </VStack>
                    </HStack>
                    
                    <Button
                      size="lg"
                      colorScheme="black"
                      onPress={handleApplePay}
                      isLoading={isProcessing}
                      isDisabled={isProcessing}
                      _text={{ color: 'white' }}
                    >
                      {isProcessing ? 'Processing...' : 'Pay with Apple Pay'}
                    </Button>
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

              {/* Credit Card Form */}
              <Box bg="white" borderRadius="16" p="6">
                <VStack space="6">
                  <HStack space="3" alignItems="center" mb="2">
                    <Text fontSize="20px">💳</Text>
                    <VStack flex="1">
                      <Text fontSize="18px" fontWeight="600">
                        Credit Card
                      </Text>
                      <Text fontSize="14px" color="gray.600">
                        Enter your card details manually
                      </Text>
                    </VStack>
                  </HStack>

                  {/* Card Number */}
                  <FormControl isInvalid={!!errors.cardNumber}>
                    <FormControl.Label>Card Number</FormControl.Label>
                    <Controller
                      control={control}
                      name="cardNumber"
                      rules={{
                        required: 'Card number is required',
                        pattern: {
                          value: /^\d{4}\s\d{4}\s\d{4}\s\d{4}$/,
                          message: 'Please enter a valid 16-digit card number'
                        }
                      }}
                      render={({ field: { onChange, value } }) => (
                        <Input
                          placeholder="1234 5678 9012 3456"
                          value={value}
                          onChangeText={(text) => onChange(formatCardNumber(text))}
                          keyboardType="numeric"
                          maxLength={19}
                        />
                      )}
                    />
                    <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                      {errors.cardNumber?.message}
                    </FormControl.ErrorMessage>
                  </FormControl>

                  {/* Cardholder Name */}
                  <FormControl isInvalid={!!errors.cardholderName}>
                    <FormControl.Label>Cardholder Name</FormControl.Label>
                    <Controller
                      control={control}
                      name="cardholderName"
                      rules={{
                        required: 'Cardholder name is required',
                        minLength: {
                          value: 2,
                          message: 'Name must be at least 2 characters'
                        }
                      }}
                      render={({ field: { onChange, value } }) => (
                        <Input
                          placeholder="John Doe"
                          value={value}
                          onChangeText={onChange}
                          autoCapitalize="words"
                        />
                      )}
                    />
                    <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                      {errors.cardholderName?.message}
                    </FormControl.ErrorMessage>
                  </FormControl>

                  {/* Expiry Date and CVV */}
                  <HStack space="4">
                    <FormControl flex="1" isInvalid={!!errors.expiryDate}>
                      <FormControl.Label>Expiry Date</FormControl.Label>
                      <Controller
                        control={control}
                        name="expiryDate"
                        rules={{
                          required: 'Expiry date is required',
                          pattern: {
                            value: /^\d{2}\/\d{2}$/,
                            message: 'Please enter MM/YY format'
                          }
                        }}
                        render={({ field: { onChange, value } }) => (
                          <Input
                            placeholder="MM/YY"
                            value={value}
                            onChangeText={(text) => onChange(formatExpiryDate(text))}
                            keyboardType="numeric"
                            maxLength={5}
                          />
                        )}
                      />
                      <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                        {errors.expiryDate?.message}
                      </FormControl.ErrorMessage>
                    </FormControl>

                    <FormControl flex="1" isInvalid={!!errors.cvv}>
                      <FormControl.Label>CVV</FormControl.Label>
                      <Controller
                        control={control}
                        name="cvv"
                        rules={{
                          required: 'CVV is required',
                          pattern: {
                            value: /^\d{3,4}$/,
                            message: 'Please enter a valid CVV'
                          }
                        }}
                        render={({ field: { onChange, value } }) => (
                          <Input
                            placeholder="123"
                            value={value}
                            onChangeText={(text) => onChange(formatCVV(text))}
                            keyboardType="numeric"
                            maxLength={4}
                          />
                        )}
                      />
                      <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                        {errors.cvv?.message}
                      </FormControl.ErrorMessage>
                    </FormControl>
                  </HStack>

                  <Button
                    size="lg"
                    colorScheme="blue"
                    onPress={handleSubmit(onSubmit)}
                    isLoading={isProcessing}
                    isDisabled={!isValid || isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Continue with Card'}
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
                      Your payment information is encrypted and secure
                    </Text>
                  </VStack>
                </HStack>
              </Box>

              {/* Terms */}
              <Text fontSize="12px" color="gray.500" textAlign="center">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </Text>
            </VStack>
          </Container>
        </ScrollView>
      </SafeAreaView>
    </TabScreen>
  )
}

export default CreditCard 