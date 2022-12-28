import React, { useEffect } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { SafeAreaView, StatusBar } from 'react-native'
import { Button, Container, Text, useToast } from 'native-base'
import { firebase } from '@react-native-firebase/auth'

const Main = () => {
  const { reset } = useNavigation()
  const isFocused = useIsFocused()
  const toast = useToast()
  const user = firebase.auth().currentUser

  const handleLogOut = async () => {
    try {
      await firebase.auth().signOut()
      reset({
        index: 0,
        routes: [{ name: 'Welcome' }]
      })
    } catch (e) {
      console.log('handleLogOut', e)
      toast.show({
        status: 'error',
        description: e.message
      })
    }
  }

  useEffect(() => {
    if (isFocused) {
      StatusBar.setBarStyle('dark-content', true)
    }
  }, [isFocused])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F6F6' }}>
      <KeyboardAwareScrollView>
        <Container px="20px" mt="16px" w="100%" minW="100%">
          <Text variant="title">Welcome back</Text>
          <Text mt="20px">{user?.email || ''}</Text>
          <Button size="lg" variant="primary" mt="30px" onPress={handleLogOut}>
            Sign Out
          </Button>
        </Container>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

export default Main
