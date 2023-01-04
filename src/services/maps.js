import axios from 'axios'

export const getRoute = async (origin, destination) => {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
  const config = {
    headers,
    params: {
      key: 'AIzaSyCe80iwSU9qzr-p5Zj8jQVfcjZFa9k_zHs',
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      mode: 'walking',
      units: 'metric'
    },
    timeout: 30000
  }
  const response = await axios.get(
    'https://maps.googleapis.com/maps/api/directions/json',
    config
  )
  return response.data
}

export default { getRoute }
