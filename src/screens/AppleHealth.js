import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { Text, Button, Flex, useToast } from 'native-base'
import AuthScreen from '../components/AuthScreen'

const AppleHealth = () => {
  const { reset } = useNavigation()
  const toast = useToast()

  const handleConnect = async () => {
    try {
    } catch (e) {
      console.log('handleConnect', e)
      toast.show({
        status: 'error',
        description: e.message
      })
    }
  }

  return (
    <AuthScreen title="Welcome back">
      <Button size="lg" variant="primary" mt="30px" onPress={handleConnect}>
        Connect
      </Button>
    </AuthScreen>
  )
}

export default AppleHealth
