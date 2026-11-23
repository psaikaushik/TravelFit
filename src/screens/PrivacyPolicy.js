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
          testID="privacy-back"
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
              Last updated November 2026
            </Text>

            <VStack space="4">
              <Text fontSize="18px" fontWeight="600" accessibilityRole="header">
                Your account
              </Text>
              <Text fontSize="14px" color="gray.700" lineHeight="22px">
                Firebase Authentication handles sign-in. TravelFit stores your name, email address,
                and account creation date in Firebase to maintain your profile.
              </Text>

              <Text fontSize="18px" fontWeight="600" accessibilityRole="header">
                Steps and trips
              </Text>
              <Text fontSize="14px" color="gray.700" lineHeight="22px">
                With your permission, TravelFit reads step counts from Apple Health to track your
                virtual trips, daily goal, and achievements. Your step counts, trip progress,
                and goals are stored on this device. You can change Apple Health access in iOS Settings.
                The app uses Apple Maps to display virtual routes.
              </Text>

              <Text fontSize="18px" fontWeight="600" accessibilityRole="header">
                Diagnostics
              </Text>
              <Text fontSize="14px" color="gray.700" lineHeight="22px">
                Firebase Crashlytics helps us diagnose app crashes and device compatibility issues.
              </Text>

              <Text fontSize="18px" fontWeight="600" accessibilityRole="header">
                Delete your account
              </Text>
              <Text fontSize="14px" color="gray.700" lineHeight="22px">
                Open Profile and choose Delete Account to remove your sign-in and profile.
                This also clears TravelFit data for your account on this device.
                For privacy questions, contact privacy@travelfit.app.
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
