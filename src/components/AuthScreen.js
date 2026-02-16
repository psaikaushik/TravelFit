import React, { useEffect, useState } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { SafeAreaView, StatusBar, Platform } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import {
  GoogleSignin,
  statusCodes
} from '@react-native-google-signin/google-signin'
import { appleAuth, AppleButton } from '@invertase/react-native-apple-authentication'
import BackSVG from '../assets/icons/back.svg'
import GoogleSVG from '../assets/icons/google.svg'
import { Container, Text, Button, Flex, useToast, Pressable } from 'native-base'
import auth from '@react-native-firebase/auth'
import { getProfile, setProfile } from '../services/users'
import { setUserData } from '../services/database'
import moment from 'moment'
import { createStripeCustomer } from '../services/api'

const AuthScreen = ({ title, googleEnabled, footer, children }) => {
  const { reset, goBack } = useNavigation()
  const isFocused = useIsFocused()
  const [googleLoading, setGoogleLoading] = useState()
  const [appleLoading, setAppleLoading] = useState(false)
  const toast = useToast()

  GoogleSignin.configure({
    webClientId:
      '10048863785-mv1ommb6ja9djftbnnkrnh5cskd7850p.apps.googleusercontent.com'
  })

  const handleGoogle = async () => {
    try {
      setGoogleLoading(true)
      const { idToken } = await GoogleSignin.signIn()
      const googleCredential = auth.GoogleAuthProvider.credential(idToken)
      const { user } = await auth().signInWithCredential(googleCredential)
      let profile = await getProfile()
      if (!profile) {
        profile = {
          name: user.displayName,
          email: user.email,
          createdTime: moment().startOf('day').toISOString()
        }
        await setProfile(profile)
      }
      await setUserData(profile)
      // Ensure Stripe customer exists
      await createStripeCustomer(profile.email, profile.name).catch((err) =>
        console.log('Stripe customer will be created on CreditCard screen:', err)
      )
      // Navigate to credit card screen after successful Google sign-in
      reset({
        index: 0,
        routes: [{ name: 'CreditCard' }]
      })
    } catch (e) {
      setGoogleLoading(false)
      console.log('handleGoogle', e)
      if (e.code !== statusCodes.SIGN_IN_CANCELLED) {
        toast.show({
          status: 'error',
          description: e.message.split(', Error Domain')[0]
        })
      }
    }
  }

  const handleApple = async () => {
    try {
      setAppleLoading(true)
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME]
      })

      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Sign-In failed — no identity token returned')
      }

      const { identityToken, nonce } = appleAuthRequestResponse
      const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce)
      const { user } = await auth().signInWithCredential(appleCredential)

      let profile = await getProfile()
      if (!profile) {
        const fullName = appleAuthRequestResponse.fullName
        const displayName = fullName
          ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim()
          : user.displayName || ''
        profile = {
          name: displayName,
          email: user.email || appleAuthRequestResponse.email || '',
          createdTime: moment().startOf('day').toISOString()
        }
        await setProfile(profile)
      }
      await setUserData(profile)
      await createStripeCustomer(profile.email, profile.name).catch((err) =>
        console.log('Stripe customer will be created on CreditCard screen:', err)
      )
      reset({
        index: 0,
        routes: [{ name: 'CreditCard' }]
      })
    } catch (e) {
      setAppleLoading(false)
      console.log('handleApple', e)
      if (e.code !== appleAuth.Error.CANCELED) {
        toast.show({
          status: 'error',
          description: e.message || 'Apple Sign-In failed'
        })
      }
    }
  }

  useEffect(() => {
    if (isFocused) {
      StatusBar.setBarStyle('dark-content', true)
    }
  }, [isFocused])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F3F6' }}>
      <Flex align="flex-start">
        <Pressable ml="12px" mt="6px" p="4px" onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
          <BackSVG />
        </Pressable>
      </Flex>
      <KeyboardAwareScrollView>
        <Container px="20px" mt="12px" w="100%" minW="100%">
          <Text variant="title" accessibilityRole="header">{title}</Text>
          {children}
          {googleEnabled && (
            <Flex width="100%" align="center" mt="30px">
              <Text color="gray.500">Or connect using</Text>
              <Button
                size="lg"
                variant="primary"
                bg="red.500"
                mt="30px"
                leftIcon={
                  <GoogleSVG
                    width="24px"
                    style={{ opacity: 0.9, marginRight: 5 }}
                  />
                }
                isLoading={googleLoading}
                onPress={handleGoogle}
                accessibilityLabel="Sign in with Google"
              >
                Sign In with Google
              </Button>
              {Platform.OS === 'ios' && appleAuth.isSupported && (
                <AppleButton
                  buttonStyle={AppleButton.Style.BLACK}
                  buttonType={AppleButton.Type.SIGN_IN}
                  style={{
                    width: '100%',
                    height: 60,
                    marginTop: 16,
                    borderRadius: 20
                  }}
                  onPress={handleApple}
                />
              )}
            </Flex>
          )}
          {footer}
        </Container>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

export default AuthScreen
