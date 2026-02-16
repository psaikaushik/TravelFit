import React from 'react'
import { SafeAreaView, StatusBar, ScrollView } from 'react-native'
import { Container, Text, Button, VStack, Pressable, Flex } from 'native-base'
import { useNavigation } from '@react-navigation/native'
import BackSVG from '../assets/icons/back.svg'

const PrivacyPolicy = () => {
  const { goBack } = useNavigation()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F3F6' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F3F6" />
      <Flex align="flex-start">
        <Pressable
          ml="12px"
          mt="6px"
          p="4px"
          onPress={goBack}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <BackSVG />
        </Pressable>
      </Flex>
      <ScrollView style={{ flex: 1 }}>
        <Container px="20px" py="20px" w="100%" minW="100%">
          <VStack space="6">
            <Text fontSize="28px" fontWeight="bold" accessibilityRole="header">
              Privacy Policy
            </Text>
            <Text fontSize="12px" color="gray.500">
              Last updated: February 2026
            </Text>

            <VStack space="4">
              <Text fontSize="18px" fontWeight="600" accessibilityRole="header">
                1. Information We Collect
              </Text>
              <Text fontSize="14px" color="gray.700" lineHeight="22px">
                TravelFit collects the following information to provide our service:
              </Text>
              <Text fontSize="14px" color="gray.700" lineHeight="22px">
                - Account information: name, email address, and authentication credentials when you create an account.{'\n'}
                - Health data: step count data from Apple HealthKit, used solely to track your virtual trip progress. We read StepCount data only.{'\n'}
                - Payment information: processed securely through Stripe and Apple In-App Purchase. We never see or store your full card number.{'\n'}
                - Usage data: trip routes, progress, badges, and achievements to provide the app experience.
              </Text>

              <Text fontSize="18px" fontWeight="600" accessibilityRole="header">
                2. How We Use Your Health Data
              </Text>
              <Text fontSize="14px" color="gray.700" lineHeight="22px">
                Your health data (step count) is used exclusively to calculate your progress along your virtual trip route. We do not:{'\n\n'}
                - Use your health data for advertising or marketing{'\n'}
                - Share your health data with third parties{'\n'}
                - Store your health data in iCloud{'\n'}
                - Write any data to Apple HealthKit{'\n'}
                - Use your health data for any purpose other than displaying your trip progress
              </Text>

              <Text fontSize="18px" fontWeight="600" accessibilityRole="header">
                3. Data Storage
              </Text>
              <Text fontSize="14px" color="gray.700" lineHeight="22px">
                Your account data is stored securely using Firebase by Google. Trip progress
                and settings are stored locally on your device and in your Firebase account.
                Payment data is stored and processed by Stripe and Apple, not on our servers.
              </Text>

              <Text fontSize="18px" fontWeight="600" accessibilityRole="header">
                4. Third-Party Services
              </Text>
              <Text fontSize="14px" color="gray.700" lineHeight="22px">
                TravelFit uses the following third-party services:{'\n\n'}
                - Firebase (Google): Authentication, data storage, and analytics{'\n'}
                - Stripe: Payment processing{'\n'}
                - Apple In-App Purchase: Subscription management on iOS{'\n'}
                - Google Maps: Route visualization and place information{'\n'}
                - Apple HealthKit: Step count data (with your explicit permission)
              </Text>

              <Text fontSize="18px" fontWeight="600" accessibilityRole="header">
                5. Your Rights
              </Text>
              <Text fontSize="14px" color="gray.700" lineHeight="22px">
                You have the right to:{'\n\n'}
                - Access your personal data{'\n'}
                - Request deletion of your account and data{'\n'}
                - Revoke HealthKit access at any time through iOS Settings{'\n'}
                - Cancel your subscription at any time{'\n'}
                - Opt out of analytics data collection
              </Text>

              <Text fontSize="18px" fontWeight="600" accessibilityRole="header">
                6. Data Retention
              </Text>
              <Text fontSize="14px" color="gray.700" lineHeight="22px">
                We retain your account data for as long as your account is active. If you
                delete your account, we will remove your personal data within 30 days.
                Health data is not retained on our servers — it is only read from HealthKit
                in real-time.
              </Text>

              <Text fontSize="18px" fontWeight="600" accessibilityRole="header">
                7. Children's Privacy
              </Text>
              <Text fontSize="14px" color="gray.700" lineHeight="22px">
                TravelFit is not intended for children under 13. We do not knowingly
                collect personal information from children under 13.
              </Text>

              <Text fontSize="18px" fontWeight="600" accessibilityRole="header">
                8. Contact Us
              </Text>
              <Text fontSize="14px" color="gray.700" lineHeight="22px">
                If you have questions about this privacy policy or your data, please
                contact us at privacy@travelfit.app.
              </Text>
            </VStack>

            <Button
              size="lg"
              variant="ghost"
              colorScheme="gray"
              onPress={goBack}
              accessibilityLabel="Close privacy policy"
            >
              Done
            </Button>
          </VStack>
        </Container>
      </ScrollView>
    </SafeAreaView>
  )
}

export default PrivacyPolicy
