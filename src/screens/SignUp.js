import React, { useEffect, useState } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { SafeAreaView, StatusBar } from 'react-native'
import { firebase } from '@react-native-firebase/auth'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import {
  Container,
  Text,
  ArrowBackIcon,
  Button,
  Flex,
  useToast
} from 'native-base'
import { useForm } from 'react-hook-form'
import FormInput from '../components/FormInput'
import GoogleSVG from '../assets/icons/google.svg'
import {
  GoogleSignin,
  statusCodes
} from '@react-native-google-signin/google-signin'

const SignUp = () => {
  const { reset, navigate, goBack } = useNavigation()
  const isFocused = useIsFocused()
  const [googleLoading, setGoogleLoading] = useState()
  const toast = useToast()
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm()

  const handleLogin = () => {
    navigate('Login')
  }

  GoogleSignin.configure({
    webClientId:
      '10048863785-mv1ommb6ja9djftbnnkrnh5cskd7850p.apps.googleusercontent.com'
  })

  const handleRegister = async (data) => {
    try {
      const { name, email, password } = data
      const user = await firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
      console.log('user', user)
      reset({
        index: 0,
        routes: [{ name: 'Main' }]
      })
    } catch (e) {
      console.log('handleLogIn', e)
      toast.show({
        status: 'error',
        description: e.message
      })
    }
  }

  const handleGoogle = async () => {
    try {
      setGoogleLoading(true)
      const { idToken } = await GoogleSignin.signIn()
      const googleCredential =
        firebase.auth.GoogleAuthProvider.credential(idToken)
      const user = await firebase.auth().signInWithCredential(googleCredential)
      console.log('user', user)
      reset({
        index: 0,
        routes: [{ name: 'Main' }]
      })
    } catch (e) {
      setGoogleLoading(false)
      console.log('handleGoogle', e)
      if (e.code !== statusCodes.SIGN_IN_CANCELLED) {
        toast.show({
          status: 'error',
          description: e.message.split(', Error Domain')[0]
        })
      }
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
          <Text variant="title">Join Us</Text>
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
          <Flex width="100%" align="center" mt="30px">
            <Text color="gray.500">Or connect using</Text>
            <Button
              size="lg"
              variant="primary"
              bg="red.500"
              mt="30px"
              leftIcon={
                <GoogleSVG
                  width="24px"
                  style={{ opacity: 0.9, marginRight: 5 }}
                />
              }
              isLoading={googleLoading}
              onPress={handleGoogle}
            >
              Sign In with Google
            </Button>
          </Flex>
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
            <Button
              size="md"
              py="12px"
              px="0"
              variant="link"
              onPress={handleLogin}
            >
              Login
            </Button>
          </Flex>
        </Container>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

export default SignUp
