import React, { useEffect } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { SafeAreaView, StatusBar } from 'react-native'
import { Button, Container, Text, useToast } from 'native-base'
import auth from '@react-native-firebase/auth'
import { useQuery } from '@tanstack/react-query'
import { getUserData } from '../services/database'

const Map = () => {
  const { reset } = useNavigation()
  const isFocused = useIsFocused()
  const toast = useToast()
  const user = auth().currentUser

  const { data: profile, isLoading: profileLoading } = useQuery(
    ['profile'],
    getUserData
  )

  console.log('profile', profile)

  const handleLogOut = async () => {
    try {
      await auth().signOut()
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

  if (profileLoading) return <></>

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F6F6' }}>
      <KeyboardAwareScrollView>
        <Container px="20px" mt="16px" w="100%" minW="100%">
          <Text variant="title">Welcome back</Text>
          <Text mt="20px" fontSize="20px" fontWeight="600">
            {profile?.name || ''}
          </Text>
          <Text mt="8px">{user?.email || ''}</Text>
          <Button size="lg" variant="primary" mt="30px" onPress={handleLogOut}>
            Sign Out
          </Button>
        </Container>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

export default Map
