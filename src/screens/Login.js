import React from 'react'
import { useNavigation } from '@react-navigation/native'
import auth from '@react-native-firebase/auth'
import { Text, Button, Flex, useToast } from 'native-base'
import { useForm } from 'react-hook-form'
import FormInput from '../components/FormInput'
import AuthScreen from '../components/AuthScreen'

import { cacheAccountProfile } from '../services/users'
import { authErrorMessage } from '../services/authErrors'
import { checkFlow } from '../services/helpers'

const Login = () => {
  const { reset, navigate } = useNavigation()
  const toast = useToast()
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm()

  const handleReset = () => {
    navigate('Reset')
  }

  const handleRegister = () => {
    navigate('SignUp')
  }

  const handleLogIn = async (data) => {
    try {
      const { email, password } = data
      const { user } = await auth().signInWithEmailAndPassword(email, password)
      await cacheAccountProfile(user)
      reset({
        index: 0,
        routes: [{ name: await checkFlow(user) }]
      })
    } catch (e) {
      toast.show({
        status: 'error',
        description: authErrorMessage(e.code, 'Could not log in. Try again.')
      })
    }
  }

  const footer = (
    <Flex
      width="100%"
      mt="10px"
      direction="row"
      align="center"
      justify="center"
    >
      <Text py="12px" mr="5px" fontSize="16px">
        Don't have an account?
      </Text>
      <Button
        size="md"
        py="12px"
        px="0"
        variant="link"
        onPress={handleRegister}
      >
        Join now
      </Button>
    </Flex>
  )

  return (
    <AuthScreen title="Welcome back" appleEnabled={true} footer={footer}>
      <FormInput
        id="email"
        testID="log-in-email"
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
      <FormInput
        id="password"
        testID="log-in-password"
        type="password"
        w="100%"
        mt="16px"
        variant="primary"
        placeholder="Password"
        control={control}
        errors={errors}
        validation={{ required: true }}
      />
      <Flex width="100%" align="flex-end">
        <Button
          size="md"
          py="12px"
          px="0"
          variant="link"
          width="auto"
          onPress={handleReset}
          testID="log-in-forgot-password"
        >
          Forgot password
        </Button>
      </Flex>
      <Button
        size="lg"
        variant="primary"
        mt="30px"
        isLoading={isSubmitting}
        onPress={handleSubmit(handleLogIn)}
        accessibilityLabel="Log in to your account"
        testID="log-in-submit"
      >
        Log in
      </Button>
    </AuthScreen>
  )
}

export default Login
