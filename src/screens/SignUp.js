import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { Text, Button, Flex, useToast } from 'native-base'
import { useForm } from 'react-hook-form'
import FormInput from '../components/FormInput'
import AuthScreen from '../components/AuthScreen'
import auth from '@react-native-firebase/auth'
import { setProfile } from '../services/users'
import moment from 'moment'
import { checkFlow } from '../services/helpers'
import { setUserData } from '../services/database'

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
      const profile = {
        name,
        email,
        createdTime: moment().startOf('day').toISOString()
      }
      await setProfile(profile)
      await setUserData(profile)
      const flow = await checkFlow(user)
      reset({
        index: 0,
        routes: [{ name: flow }]
      })
    } catch (e) {
      console.log('handleLogIn', e)
      toast.show({
        status: 'error',
        description: e.message
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
    <AuthScreen title="Join Us" googleEnabled={true} footer={footer}>
      <FormInput
        id="name"
        w="100%"
        mt="20px"
        variant="primary"
        placeholder="Name"
        control={control}
        errors={errors}
        validation={{ required: true }}
      />
      <FormInput
        id="email"
        w="100%"
        mt="16px"
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
      >
        Register
      </Button>
    </AuthScreen>
  )
}

export default SignUp
