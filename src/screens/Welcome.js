import React, { useEffect, useState } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Platform
} from 'react-native'
import { appleAuth, AppleButton } from '@invertase/react-native-apple-authentication'
import auth from '@react-native-firebase/auth'

import { cacheAccountProfile } from '../services/users'
import { checkFlow } from '../services/helpers'

const Welcome = () => {
  const { navigate, reset } = useNavigation()
  const isFocused = useIsFocused()
  const [appleLoading, setAppleLoading] = useState(false)

  const handleRegister = () => {
    navigate('SignUp')
  }

  const handleLogin = () => {
    navigate('Login')
  }

  const handleAppleSignIn = async () => {
    setAppleLoading(true)
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME]
      })

      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Sign-In failed')
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
    } catch (error) {
      if (error.code !== appleAuth.Error.CANCELED) {
        Alert.alert('Sign In Error', 'Failed to sign in with Apple. Please try again.')
      }
    } finally {
      setAppleLoading(false)
    }
  }

  useEffect(() => {
    if (isFocused) {
      StatusBar.setBarStyle('light-content', true)
    }
  }, [isFocused])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1A2225' }}>
      <Text style={styles.appName}>TravelFit</Text>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={styles.title} accessibilityRole="header">Walk here. Explore somewhere new.</Text>
      </View>
      <TouchableOpacity style={styles.welcomeBtn} onPress={handleRegister} accessibilityRole="button" accessibilityLabel="Start now, create an account">
        <Text style={styles.welcomeText}>Create an account</Text>
      </TouchableOpacity>
      {Platform.OS === 'ios' && appleAuth.isSupported && (
        <AppleButton
          buttonStyle={AppleButton.Style.WHITE}
          buttonType={AppleButton.Type.SIGN_IN}
          style={{
            width: '90%',
            height: 52,
            alignSelf: 'center',
            marginBottom: 10,
            borderRadius: 20
          }}
          onPress={appleLoading ? undefined : handleAppleSignIn}
        />
      )}
      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} accessibilityRole="button" accessibilityLabel="Already have an account, log in">
        <Text style={styles.loginText}>Already have an account</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.privacyBtn}
        accessibilityRole="link"
        onPress={() => navigate('PrivacyPolicy')}
      >
        <Text style={styles.privacyText}>Privacy Policy</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  appName: {
    fontSize: 24,
    marginTop: 10,
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '600'
  },
  title: {
    fontSize: 42,
    marginTop: 20,
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '900'
  },
  loginBtn: {
    height: 52,
    marginHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loginText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600'
  },
  privacyBtn: {
    padding: 12,
    marginBottom: 12,
    alignSelf: 'center'
  },
  privacyText: {
    color: '#FFFFFF',
    textDecorationLine: 'underline'
  },
  welcomeBtn: {
    height: 52,
    margin: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C4EB64'
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700'
  }
})

export default Welcome
