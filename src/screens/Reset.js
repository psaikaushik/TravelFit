import React from 'react'
import { useNavigation } from '@react-navigation/native'
import auth from '@react-native-firebase/auth'
import { Button, useToast } from 'native-base'
import { useForm } from 'react-hook-form'
import FormInput from '../components/FormInput'
import AuthScreen from '../components/AuthScreen'

const Login = () => {
  const { goBack } = useNavigation()
  const toast = useToast()
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm()

  const handleReset = async (data) => {
    try {
      const { email } = data
      const user = await auth().sendPasswordResetEmail(email)
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

  return (
    <AuthScreen title="Reset Password">
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
    </AuthScreen>
  )
}

export default Login
