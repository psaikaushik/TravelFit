import Welcome from '../screens/Welcome'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import SignUp from '../screens/SignUp'
import Login from '../screens/Login'

const { Navigator, Screen } = createNativeStackNavigator()

export function StackRoutes() {
  const { reset } = useNavigation()

  return (
    <>
      <Navigator
        initialRouteName={'Welcome'}
        screenOptions={{ headerShown: false }}
      >
        <Screen name="Welcome" component={Welcome} />
        <Screen name="SignUp" component={SignUp} />
        <Screen name="Login" component={Login} />
        {/*<Screen name="CreatePassword" component={CreatePassword} />*/}
      </Navigator>
    </>
  )
}
