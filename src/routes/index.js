import { NavigationContainer } from '@react-navigation/native'
import { StackRoutes } from './Main'
import { navigationRef } from './RootNavigation'

export const Routes = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <StackRoutes />
    </NavigationContainer>
  )
}
