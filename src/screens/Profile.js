import React, { useEffect } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { SafeAreaView, StatusBar } from 'react-native'
import { Button, Container, Flex, Text, useToast } from 'native-base'
import auth from '@react-native-firebase/auth'
import { useQuery } from '@tanstack/react-query'
import { getUserData } from '../services/database'
import TabScreen from '../components/TabScreen'
import { hasNotch } from 'react-native-device-info'

const Profile = () => {
  const { reset } = useNavigation()
  const isFocused = useIsFocused()
  const toast = useToast()
  const user = auth().currentUser
  const isIphoneX = hasNotch()

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
        <Container flex="1" px="20px" mt="16px" mb="80px" w="100%" minW="100%">
          <Flex flex="1" w="100%">
            <Flex bg="secondary.400" borderRadius="16px" py="30px" px="20px">
              <Text fontSize="20px" fontWeight="600">
                {profile?.name || ''}
              </Text>
              <Text mt="8px">{user?.email || ''}</Text>
            </Flex>
          </Flex>
          <Button size="lg" variant="primary" mt="30px" onPress={handleLogOut}>
            Sign Out
          </Button>
        </Container>
      </SafeAreaView>
    </TabScreen>
  )
}

export default Profile
