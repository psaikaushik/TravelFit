import React, { useEffect, useState } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { Text, Button, useToast, Container, Flex } from 'native-base'
import { Image, Platform, SafeAreaView, StatusBar } from 'react-native'
import HealthIMG from '../assets/images/health.png'
import AppleHealthKit from 'react-native-health'
import { getCurrentAccountId, getUserSettings, setUserSettings } from '../services/database'
import { hasActiveTrip } from '../services/helpers'

const AppleHealth = () => {
  const { reset } = useNavigation()
  const isFocused = useIsFocused()
  const toast = useToast()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleNext = async (health, uid = getCurrentAccountId()) => {
    if (!uid || getCurrentAccountId() !== uid) return
    try {
      const settings = await getUserSettings(uid)
      await setUserSettings({ ...settings, health, healthSetupCompleted: true }, uid)
      if (getCurrentAccountId() !== uid) return
      reset({ index: 0, routes: [{ name: hasActiveTrip(settings) ? 'Main' : 'Trip' }] })
    } catch {
      toast.show({ status: 'error', description: 'Could not save your Health preference. Try again.' })
    }
  }

  const handleConnect = () => {
    const uid = getCurrentAccountId()
    if (!uid) return
    if (Platform.OS !== 'ios' || !AppleHealthKit?.initHealthKit) {
      toast.show({ status: 'info', description: 'Apple Health is unavailable on this device.' })
      return
    }

    setIsConnecting(true)
    AppleHealthKit.initHealthKit({
      permissions: { read: [AppleHealthKit.Constants.Permissions.StepCount], write: [] }
    }, async (error) => {
      try {
        if (error) {
          toast.show({ status: 'error', description: 'Could not open Health permissions. You can continue without syncing.' })
        } else {
          await handleNext(true, uid)
        }
      } finally {
        setIsConnecting(false)
      }
    })
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
            Allow TravelFit to read your steps and move you along your virtual route. You can manage access in Apple Health at any time.
          </Text>
        </Flex>
        <Button size="lg" variant="primary" mt="30px" onPress={handleConnect} isLoading={isConnecting} accessibilityLabel="Connect to Apple Health">
          Connect Apple Health
        </Button>
        <Button size="lg" variant="ghost" isDisabled={isConnecting} onPress={() => handleNext(false)}>
          Continue without syncing
        </Button>
      </Container>
    </SafeAreaView>
  )
}

export default AppleHealth
