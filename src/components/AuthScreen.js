import React, { useEffect, useState } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { SafeAreaView, StatusBar } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import {
  GoogleSignin,
  statusCodes
} from '@react-native-google-signin/google-signin'
import BackSVG from '../assets/icons/back.svg'
import GoogleSVG from '../assets/icons/google.svg'
import { Container, Text, Button, Flex, useToast, Pressable } from 'native-base'
import auth from '@react-native-firebase/auth'
import { getProfile, setProfile } from '../services/users'
import { setUserData } from '../services/database'
import moment from 'moment'
import { checkFlow } from '../services/helpers'

const AuthScreen = ({ title, googleEnabled, footer, children }) => {
  const { reset, goBack } = useNavigation()
  const isFocused = useIsFocused()
  const [googleLoading, setGoogleLoading] = useState()
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

  useEffect(() => {
    if (isFocused) {
      StatusBar.setBarStyle('dark-content', true)
    }
  }, [isFocused])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F3F6' }}>
      <Flex align="flex-start">
        <Pressable ml="12px" mt="6px" p="4px" onPress={goBack}>
          <BackSVG />
        </Pressable>
      </Flex>
      <KeyboardAwareScrollView>
        <Container px="20px" mt="12px" w="100%" minW="100%">
          <Text variant="title">{title}</Text>
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
              >
                Sign In with Google
              </Button>
            </Flex>
          )}
          {footer}
        </Container>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

export default AuthScreen
