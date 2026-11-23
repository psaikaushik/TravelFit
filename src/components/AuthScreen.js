import React, { useEffect, useState } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { SafeAreaView, StatusBar, Platform } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { appleAuth, AppleButton } from '@invertase/react-native-apple-authentication'
import BackSVG from '../assets/icons/back.svg'
import { Container, Text, Flex, useToast, Pressable } from 'native-base'
import auth from '@react-native-firebase/auth'

import { cacheAccountProfile } from '../services/users'
import { checkFlow } from '../services/helpers'

const AuthScreen = ({ title, appleEnabled, footer, children }) => {
  const { reset, goBack } = useNavigation()
  const isFocused = useIsFocused()
  const [appleLoading, setAppleLoading] = useState(false)
  const toast = useToast()

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
      const fullName = appleAuthRequestResponse.fullName
      const name = [fullName?.givenName, fullName?.familyName].filter(Boolean).join(' ')
      await cacheAccountProfile(user, name || user.displayName)
      reset({
        index: 0,
        routes: [{ name: await checkFlow(user) }]
      })
    } catch (e) {
      if (e.code !== appleAuth.Error.CANCELED) {
        toast.show({
          status: 'error',
          description: e.message || 'Apple Sign-In failed'
        })
      }
    } finally {
      setAppleLoading(false)
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
          {appleEnabled && Platform.OS === 'ios' && appleAuth.isSupported && (
            <Flex width="100%" align="center" mt="30px">
              <Text color="gray.500">Or connect using</Text>
              <AppleButton
                buttonStyle={AppleButton.Style.BLACK}
                buttonType={AppleButton.Type.SIGN_IN}
                style={{
                  width: '100%',
                  height: 60,
                  marginTop: 16,
                  borderRadius: 20
                }}
                onPress={appleLoading ? undefined : handleApple}
              />
            </Flex>
          )}
          {footer}
        </Container>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

export default AuthScreen
