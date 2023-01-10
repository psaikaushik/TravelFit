import React, { useEffect } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { Text, Button, useToast, Container, Flex } from 'native-base'
import { Alert, Image, Linking, SafeAreaView, StatusBar } from 'react-native'
import HealthIMG from '../assets/images/health.png'
import AppleHealthKit from 'react-native-health'
import { getUserSettings, setUserSettings } from '../services/database'

const AppleHealth = () => {
  const { reset } = useNavigation()
  const isFocused = useIsFocused()
  const toast = useToast()

  const handleConnect = () => {
    AppleHealthKit.initHealthKit(
      {
        permissions: {
          read: [AppleHealthKit.Constants.Permissions.Steps]
        }
      },
      async (error, result) => {
        console.log('result', error, result)
        if (!!error) {
          console.log('[ERROR] Cannot grant permissions!', error)
          toast.show({
            status: 'error',
            description: error
          })
          Alert.alert(
            'Health Permission Denied',
            'TravelFit is not longer able to ask for Health Permission, ' +
              'you need to go to the settings and manually enable it',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {}
              },
              {
                text: 'Open Settings',
                onPress: () => {
                  Linking.openSettings()
                }
              }
            ]
          )
          return
        }

        const userSettings = (await getUserSettings()) || {}
        await setUserSettings({ ...userSettings, healthConnected: true })
        reset({
          index: 0,
          routes: [{ name: 'Main' }]
        })
      }
    )
  }

  useEffect(() => {
    if (isFocused) {
      StatusBar.setBarStyle('dark-content', true)
    }
  }, [isFocused])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <Container px="20px" mt="12px" w="100%" minW="100%" flexGrow="1">
        <Flex flexGrow="1" width="100%">
          <Flex align="center" width="100%">
            <Image
              source={HealthIMG}
              style={{
                resizeMode: 'contain',
                width: 100,
                height: 90
              }}
            />
          </Flex>
          <Text variant="title" mt="20px">
            Connect to Health
          </Text>
          <Text variant="subtitle" mt="10px">
            When you connect TravelFit to Health your profile will be kept up to
            date automatically with latest activity data.
          </Text>
        </Flex>
        <Button size="lg" variant="primary" mt="30px" onPress={handleConnect}>
          Connect
        </Button>
      </Container>
    </SafeAreaView>
  )
}

export default AppleHealth
