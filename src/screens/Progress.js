import React, { useEffect } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { SafeAreaView, StatusBar } from 'react-native'
import { Button, Container, Flex, Text, useToast } from 'native-base'
import auth from '@react-native-firebase/auth'
import { useQuery } from '@tanstack/react-query'
import { getUserData } from '../services/database'
import TabScreen from '../components/TabScreen'

const Progress = () => {
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
    <TabScreen>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F3F6' }}>
        <Flex
          h="120px"
          bg="border"
          left="19px"
          right="19px"
          top="11px"
          position="absolute"
          borderRadius="16px"
        />
        <Flex h="100px" bg="secondary.400" borderBottomRadius="16px" />
        <Flex
          h="120px"
          bg="white"
          left="20px"
          right="20px"
          top="10px"
          position="absolute"
          borderRadius="16px"
        />
        <Container px="20px" mt="16px" w="100%" minW="100%"></Container>
      </SafeAreaView>
    </TabScreen>
  )
}

export default Progress
