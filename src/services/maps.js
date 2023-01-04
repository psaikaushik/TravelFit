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

export const getNearbyPlaces = async (location) => {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
  const config = {
    headers,
    params: {
      key: 'AIzaSyCe80iwSU9qzr-p5Zj8jQVfcjZFa9k_zHs',
      location: `${location.latitude},${location.longitude}`,
      radius: '50000',
      type: 'restaurant'
    },
    timeout: 30000
  }
  const response = await axios.get(
    'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
    config
  )
  return response.data
}

export const getPlaces = async (waypoints, distance) => {
  const promises = []
  const breakPoints = []
  const placeKeys = {}
  const places = []
  const radius = Math.ceil(distance / 10)
  const jump = Math.ceil(waypoints.length / 10)
  // console.log('waypoints', waypoints.length, radius, distance)
  for (let j = jump; j < waypoints.length; j += jump) {
    // console.log('indexes', j)
    breakPoints.push(waypoints[j])
    promises.push(getNearbyPlaces(waypoints[j]))
  }
  const results = await Promise.all(promises)
  for (let i = 0; i < results.length; i++) {
    // if (google.maps.geometry.poly.containsLocation(results[i].geometry.location,PolygonBound)) {
    // results[i].geometry.location
    // }
    const result = results[i]
    if (result.status === 'OK') {
      const _places = result.results || []
      const filtered = _places.filter(
        (x) => x.types.includes('tourist_attraction') && !placeKeys[x.place_id]
      )
      filtered.forEach((x) => {
        placeKeys[x.place_id] = true
      })
      places.push(...filtered)
    }
  }
  console.log('places', places.length, JSON.stringify(places))
  return { breakPoints, places }
}

export default { getRoute, getNearbyPlaces, getPlaces }
