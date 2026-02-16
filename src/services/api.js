import functions from '@react-native-firebase/functions'

const callFunction = async (name, data = {}) => {
  const result = await functions().httpsCallable(name)(data)
  return result.data
}

export const createStripeCustomer = (email, name) => {
  return callFunction('createCustomer', { email, name })
}

export const createSetupIntent = () => {
  return callFunction('createSetupIntent')
}

export const createSubscription = (priceId) => {
  return callFunction('createSubscription', { priceId })
}

export const getSubscriptionStatus = () => {
  return callFunction('getSubscriptionStatus')
}

export const cancelSubscription = () => {
  return callFunction('cancelSubscription')
}
