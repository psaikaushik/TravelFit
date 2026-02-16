import functions from '@react-native-firebase/functions'

const callFunction = async (name, data = {}) => {
  const result = await functions().httpsCallable(name)(data)
  return result.data
}

// Stripe
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

// Google Maps (proxied through Cloud Functions — API key stays server-side)
export const mapsGetRoute = (origin, destination) => {
  return callFunction('mapsGetRoute', { origin, destination })
}

export const mapsGetNearbyPlaces = (location, radius) => {
  return callFunction('mapsGetNearbyPlaces', { location, radius: `${radius}` })
}

export const mapsGetLocationDetails = (latlng) => {
  return callFunction('mapsGetLocationDetails', { latlng })
}

export const mapsGetCityDetails = (input) => {
  return callFunction('mapsGetCityDetails', { input })
}

export const mapsGetPlaceDetails = (placeId, fields) => {
  return callFunction('mapsGetPlaceDetails', { placeId, fields })
}
