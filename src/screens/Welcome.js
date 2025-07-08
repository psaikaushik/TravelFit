import React, { useEffect } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert
} from 'react-native'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import auth from '@react-native-firebase/auth'
import GoogleIcon from '../assets/icons/google.svg'

const Welcome = () => {
  const { navigate } = useNavigation()
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
        webClientId: 'YOUR_WEB_CLIENT_ID', // Replace with your actual web client ID
        offlineAccess: true,
      })

      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
      
      // Get the users ID token
      const { idToken } = await GoogleSignin.signIn()

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken)

      // Sign-in the user with the credential
      await auth().signInWithCredential(googleCredential)
      
      // Navigation will be handled by the auth state listener in routes/index.js
    } catch (error) {
      console.log('Google Sign-In Error:', error)
      Alert.alert(
        'Sign In Error',
        'Failed to sign in with Google. Please try again.',
        [{ text: 'OK' }]
      )
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
        <Text style={styles.title}>Unleash Your Health</Text>
      </View>
      <TouchableOpacity style={styles.welcomeBtn} onPress={handleRegister}>
        <Text style={styles.welcomeText}>Start Now</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn}>
        <GoogleIcon width={24} height={24} />
        <Text style={styles.googleText}>Continue with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
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
