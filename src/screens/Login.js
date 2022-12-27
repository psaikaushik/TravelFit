import React, { useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'

const Login = () => {
  const { navigate } = useNavigation()

  useEffect(() => {
    StatusBar.setBarStyle('light-content', true)
  }, [])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F6F6' }}>
      <Text style={styles.appName}>TravelFit</Text>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={styles.title}>Unleash Your Health</Text>
      </View>
      <TouchableOpacity style={styles.welcomeBtn}>
        <Text style={styles.welcomeText}>Start Now</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.loginBtn}>
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
  }
})

export default Login
