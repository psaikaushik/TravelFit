import React, { useEffect } from 'react'
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
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { appleAuth, AppleButton } from '@invertase/react-native-apple-authentication'
import auth from '@react-native-firebase/auth'
import GoogleIcon from '../assets/icons/google.svg'
import { getProfile, setProfile } from '../services/users'
import { setUserData } from '../services/database'
import { createStripeCustomer } from '../services/api'
import moment from 'moment'

const Welcome = () => {
  const { navigate, reset } = useNavigation()
  const isFocused = useIsFocused()

  const handleRegister = () => {
    navigate('SignUp')
  }

  const handleLogin = () => {
    navigate('Login')
  }

  const handleGoogleSignIn = async () => {
    try {
      // Configure Google Sign-In
      await GoogleSignin.configure({
        webClientId: '10048863785-mv1ommb6ja9djftbnnkrnh5cskd7850p.apps.googleusercontent.com',
        offlineAccess: true,
      })

      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
      
      // Get the users ID token
      const { idToken } = await GoogleSignin.signIn()

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken)

      // Sign-in the user with the credential
      const { user } = await auth().signInWithCredential(googleCredential)
      
      // Create or get user profile
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
    } catch (error) {
      console.log('Google Sign-In Error:', error)
      if (error.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert(
          'Sign In Error',
          'Failed to sign in with Google. Please try again.',
          [{ text: 'OK' }]
        )
      }
    }
  }

  const handleAppleSignIn = async () => {
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
      await createStripeCustomer(profile.email, profile.name).catch(() => {})
      reset({
        index: 0,
        routes: [{ name: 'CreditCard' }]
      })
    } catch (error) {
      console.log('Apple Sign-In Error:', error)
      if (error.code !== appleAuth.Error.CANCELED) {
        Alert.alert('Sign In Error', 'Failed to sign in with Apple. Please try again.')
      }
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
        <Text style={styles.title} accessibilityRole="header">Unleash Your Health</Text>
      </View>
      <TouchableOpacity style={styles.welcomeBtn} onPress={handleRegister} accessibilityRole="button" accessibilityLabel="Start now, create an account">
        <Text style={styles.welcomeText}>Start Now</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} accessibilityRole="button" accessibilityLabel="Continue with Google">
        <GoogleIcon width={24} height={24} />
        <Text style={styles.googleText}>Continue with Google</Text>
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
          onPress={handleAppleSignIn}
        />
      )}
      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} accessibilityRole="button" accessibilityLabel="Already have an account, log in">
        <Text style={styles.loginText}>Already have an account</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1
  },
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
    marginBottom: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loginText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600'
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
  },
  googleBtn: {
    height: 52,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  googleText: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '600',
    marginLeft: 12
  }
})

export default Welcome
