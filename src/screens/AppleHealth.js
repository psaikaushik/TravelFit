import React, { useEffect } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { Text, Button, useToast, Container, Flex } from 'native-base'
import { Alert, Image, SafeAreaView, StatusBar } from 'react-native'
import HealthIMG from '../assets/images/health.png'
import AppleHealthKit from 'react-native-health'
import { getUserSettings, setUserSettings } from '../services/database'

const AppleHealth = () => {
  const { reset } = useNavigation()
  const isFocused = useIsFocused()
  const toast = useToast()

  const handleNext = async () => {
    const userSettings = (await getUserSettings()) || {}
    const { route, distance, breakPoints } = userSettings
    await setUserSettings({ ...userSettings, health: true })
    reset({
      index: 0,
      routes: [{ name: !route || !distance || !breakPoints ? 'Trip' : 'Main' }]
    })
  }

  const handleConnect = () => {
    AppleHealthKit.initHealthKit(
      {
        permissions: {
          read: [AppleHealthKit.Constants.Permissions.StepCount]
        }
      },
      async (error, result) => {
        console.log('initHealthKit', result, error)
        if (!!error) {
          toast.show({
            status: 'error',
            description: error
          })
          return
        }
        if (result !== 1) {
          Alert.alert(
            'Health Permission Denied',
            'TravelFit is not longer able to ask for Health Permission, ' +
              'you need to go to the settings and manually enable it',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: handleNext
              },
              {
                text: 'Enable Access',
                onPress: handleConnect
              }
            ]
          )
          return
        }
        await handleNext()
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
          <Text variant="title" mt="20px" accessibilityRole="header">
            Connect to Health
          </Text>
          <Text variant="subtitle" mt="10px">
            When you connect TravelFit to Health your profile will be kept up to
            date automatically with latest activity data.
          </Text>
        </Flex>
        <Button size="lg" variant="primary" mt="30px" onPress={handleConnect} accessibilityLabel="Connect to Apple Health">
          Connect
        </Button>
      </Container>
    </SafeAreaView>
  )
}

export default AppleHealth
