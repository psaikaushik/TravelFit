import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { Text, Button, Flex, useToast } from 'native-base'
import { useForm } from 'react-hook-form'
import FormInput from '../components/FormInput'
import AuthScreen from '../components/AuthScreen'
import auth from '@react-native-firebase/auth'

import { getAccountEntryRoute } from '../services/users'
import { authErrorMessage } from '../services/authErrors'

const SignUp = () => {
  const { reset, navigate } = useNavigation()
  const toast = useToast()
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm()

  const handleLogin = () => {
    navigate('Login')
  }

  const handleRegister = async (data) => {
    try {
      const { name, email, password } = data
      const { user } = await auth().createUserWithEmailAndPassword(
        email,
        password
      )
      const route = await getAccountEntryRoute(user, name.trim())
      if (route) reset({ index: 0, routes: [{ name: route }] })
    } catch (e) {
      toast.show({
        status: 'error',
        description: authErrorMessage(e.code, 'Could not finish creating your account. Try again.')
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
      <Text py="12px" mr="5px">
        Already have an account?
      </Text>
      <Button size="md" py="12px" px="0" variant="link" onPress={handleLogin}>
        Login
      </Button>
    </Flex>
  )

  return (
    <AuthScreen title="Join Us" appleEnabled={true} footer={footer}>
      <FormInput
        id="name"
        testID="sign-up-name"
        w="100%"
        mt="20px"
        variant="primary"
        placeholder="Name"
        autoCorrect={false}
        control={control}
        errors={errors}
        validation={{
          required: true,
          validate: (name) => {
            const length = name.trim().length
            return (length > 0 && length <= 100) || 'Enter a name with 1 to 100 characters.'
          }
        }}
      />
      <FormInput
        id="email"
        testID="sign-up-email"
        w="100%"
        mt="16px"
        variant="primary"
        placeholder="Email Address"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
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
        testID="sign-up-password"
        type="password"
        w="100%"
        mt="16px"
        variant="primary"
        placeholder="Password"
        control={control}
        errors={errors}
        validation={{ required: true }}
      />
      <Button
        size="lg"
        variant="primary"
        mt="40px"
        isLoading={isSubmitting}
        onPress={handleSubmit(handleRegister)}
        accessibilityLabel="Create your account"
        testID="sign-up-submit"
      >
        Register
      </Button>
    </AuthScreen>
  )
}

export default SignUp
