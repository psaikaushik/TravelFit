import React, { useEffect, useRef, useState } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { Text, Button, useToast, Container, Flex } from 'native-base'
import { Image, Platform, SafeAreaView, StatusBar } from 'react-native'
import HealthIMG from '../assets/images/health.png'
import AppleHealthKit from 'react-native-health'
import { getCurrentAccountId, getUserSettings, setUserSettings } from '../services/database'
import { hasActiveTrip } from '../services/helpers'

const requestStepAccess = () => new Promise((resolve, reject) => {
  AppleHealthKit.initHealthKit({
    permissions: { read: [AppleHealthKit.Constants.Permissions.StepCount], write: [] }
  }, (error) => error ? reject(error) : resolve())
})

const AppleHealth = () => {
  const { reset } = useNavigation()
  const isFocused = useIsFocused()
  const toast = useToast()
  const mounted = useRef(false)
  const busy = useRef(false)
  const [pending, setPending] = useState(null)

  const completeSetup = async (health) => {
    const uid = getCurrentAccountId()
    if (!uid || busy.current) return
    if (health && (Platform.OS !== 'ios' || !AppleHealthKit?.initHealthKit)) {
      toast.show({ status: 'info', description: 'Apple Health is unavailable on this device.' })
      return
    }

    busy.current = true
    setPending(health ? 'connect' : 'skip')
    const isCurrent = () => mounted.current && getCurrentAccountId() === uid
    let errorMessage = 'Could not open Health permissions. You can continue without syncing.'

    try {
      if (health) await requestStepAccess()
      if (!isCurrent()) return

      errorMessage = 'Could not save your Health preference. Try again.'
      const settings = await getUserSettings(uid)
      if (!isCurrent()) return
      await setUserSettings({ ...settings, health, healthSetupCompleted: true }, uid)
      if (isCurrent()) {
        reset({ index: 0, routes: [{ name: hasActiveTrip(settings) ? 'Main' : 'Trip' }] })
      }
    } catch {
      if (isCurrent()) toast.show({ status: 'error', description: errorMessage })
    } finally {
      busy.current = false
      if (mounted.current) setPending(null)
    }
  }

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

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
        <Button size="lg" variant="primary" mt="30px" onPress={() => completeSetup(true)} isLoading={pending === 'connect'} isDisabled={!!pending} accessibilityLabel="Connect to Apple Health" testID="health-connect">
          Connect Apple Health
        </Button>
        <Button size="lg" variant="ghost" isLoading={pending === 'skip'} isDisabled={!!pending} onPress={() => completeSetup(false)} testID="health-skip">
          Continue without syncing
        </Button>
      </Container>
    </SafeAreaView>
  )
}

export default AppleHealth
