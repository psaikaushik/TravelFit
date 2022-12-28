import React, { useEffect } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { SafeAreaView, StatusBar } from 'react-native'
import { firebase } from '@react-native-firebase/auth'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { Container, Text, ArrowBackIcon, Button, useToast } from 'native-base'
import { useForm } from 'react-hook-form'
import FormInput from '../components/FormInput'

const Login = () => {
  const { goBack } = useNavigation()
  const isFocused = useIsFocused()
  const toast = useToast()
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm()

  const handleReset = async (data) => {
    try {
      const { email } = data
      const user = await firebase.auth().sendPasswordResetEmail(email)
      console.log('user', user)
      toast.show({
        status: 'success',
        description: 'Password reset email sent'
      })
      goBack()
    } catch (e) {
      console.log('handleLogIn', e)
    }
  }

  useEffect(() => {
    if (isFocused) {
      StatusBar.setBarStyle('dark-content', true)
    }
  }, [isFocused])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F6F6' }}>
      <ArrowBackIcon
        onPress={goBack}
        color="black"
        size="28px"
        mt="10px"
        ml="16px"
      />
      <KeyboardAwareScrollView>
        <Container px="20px" mt="16px" w="100%" minW="100%">
          <Text variant="title">Reset Password</Text>
          <FormInput
            id="email"
            w="100%"
            mt="30px"
            variant="primary"
            placeholder="Email Address"
            control={control}
            errors={errors}
            validation={{
              required: true,
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            }}
          />
          <Button
            size="lg"
            variant="primary"
            mt="40px"
            isLoading={isSubmitting}
            onPress={handleSubmit(handleReset)}
          >
            Send Reset Link
          </Button>
        </Container>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

export default Login
