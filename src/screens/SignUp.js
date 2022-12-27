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
import BaseScreen from '../components/BaseScreen'

const SignUp = () => {
  const { navigate } = useNavigation()

  useEffect(() => {
    StatusBar.setBarStyle('dark-content', true)
  }, [])

  return (
    <BaseScreen title="Register" backBtn={true}>
      <View style={{ flex: 1 }}></View>
      <TouchableOpacity style={styles.welcomeBtn}>
        <Text style={styles.welcomeText}>Create Account</Text>
      </TouchableOpacity>
    </BaseScreen>
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

export default SignUp
