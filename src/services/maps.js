import axios from 'axios'
import {
  calcBreakpointsProgress,
  calcProgress,
  getDestinationStep,
  getTopPlace
} from './helpers'

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
      radius: '20000',
      type: 'tourist_attraction'
    },
    timeout: 30000
  }
  const response = await axios.get(
    'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
    config
  )
  return response.data
}

export const getLocationDetails = async (location) => {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
  const config = {
    headers,
    params: {
      key: 'AIzaSyCe80iwSU9qzr-p5Zj8jQVfcjZFa9k_zHs',
      latlng: `${location.latitude},${location.longitude}`
    },
    timeout: 30000
  }
  const response = await axios.get(
    'https://maps.googleapis.com/maps/api/geocode/json',
    config
  )
  return response.data
}

export const getCityDetails = async (name) => {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
  const config = {
    headers,
    params: {
      key: 'AIzaSyCe80iwSU9qzr-p5Zj8jQVfcjZFa9k_zHs',
      input: name,
      types: '(cities)'
    },
    timeout: 30000
  }
  const response = await axios.get(
    'https://maps.googleapis.com/maps/api/place/autocomplete/json',
    config
  )
  return response.data
}

export const getPlaceDetails = async (id, fields = 'photo') => {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
  const config = {
    headers,
    params: {
      key: 'AIzaSyCe80iwSU9qzr-p5Zj8jQVfcjZFa9k_zHs',
      place_id: id,
      fields
    },
    timeout: 30000
  }
  const response = await axios.get(
    'https://maps.googleapis.com/maps/api/place/details/json',
    config
  )
  return response.data
}

export const calcDistance = (coordinate1, coordinate2) => {
  const toRad = (val) => (val * Math.PI) / 180
  let R = 6371 // KM
  let dLat = toRad(coordinate2.latitude - coordinate1.latitude)
  let dLon = toRad(coordinate2.longitude - coordinate1.longitude)
  let lat1 = toRad(coordinate1.latitude)
  let lat2 = toRad(coordinate2.latitude)
  let a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const getPlaces = async (steps, route, badges, distance) => {
  const promises = []
  const breakPoints = []
  const placeKeys = {}
  let places = [...(badges || [])]
  const diameter = 40

  let i = 0
  let l = 0
  while (i < route.length - 1) {
    const point = route[i]
    let closest = i + 1
    // Find next nearest point
    for (let x = i + 1; x < route.length; x++) {
      const distance = calcDistance(point, route[x])
      if (distance >= diameter) {
        closest = x
        l = x
        breakPoints.push(route[i])
        break
      }
    }
    i = closest
  }

  let j = route.length - 1
  while (j > l) {
    const point = route[j]
    let closest = j - 1
    // Find next nearest point
    for (let x = j - 1; x > 0; x--) {
      const distance = calcDistance(point, route[x])
      if (distance >= diameter) {
        closest = x
        breakPoints.push(route[j])
        break
      }
    }
    j = closest
  }

  breakPoints.shift(1)

  console.log('breakPoints', breakPoints.length)

  if (places.length === 0) {
    // Only fetch places if empty
    breakPoints.forEach((item) => {
      promises.push(getNearbyPlaces(item))
    })
    const results = await Promise.all(promises)
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      let place = null
      if (result.status === 'OK') {
        const _places = result.results || []
        const filtered = _places.filter(
          (x) =>
            x.types.includes('tourist_attraction') &&
            !!x.photos &&
            x.photos.length > 0 &&
            !placeKeys[x.place_id]
        )
        if (filtered.length > 1) {
          // Order by score
          place = getTopPlace(filtered)
        } else if (filtered.length === 1) {
          place = filtered[0]
        }
        if (!!place) {
          placeKeys[place.place_id] = true
          console.log('point', i, place?.name || '-') // filtered.map((x) => x.name).join(', ')
        }
      }
      places.push(place)
    }
  }

  const progressIdx = Math.round(
    (calcProgress(steps, distance) / 100) * route?.length
  )
  const progressRoute = getDestinationStep(progressIdx, route)
  const destinationPoint =
    progressRoute.length > 0 ? progressRoute[progressRoute.length - 1] : 0

  // Calculate distance from progress to each break point
  places = calcBreakpointsProgress(
    progressIdx,
    destinationPoint,
    route,
    breakPoints,
    places
  )

  return { breakPoints, places }
}

export default { getRoute, getNearbyPlaces, getLocationDetails, getPlaces }

// Golden Gate Park, California Academy of Sciences, de Young Museum, San Francisco Botanical Garden, Golden Gate Park Polo Field, Grandview Park, Robin Williams Meadow, Koret Children's Playground, Lindley Meadow, Hawk Hill, Church In San Francisco, Morrison Planetarium, Tank Hill, 16th Avenue Tiled Steps, Japanese Tea Garden, San Fran Dhammaram Temple, Kezar Triangle, Golden Gate Park CommUNITY Garden, Hellman Hollow Picnic Area, Prayerbook Cross, Six Flags Magic Mountain, Hurricane Harbor Los Angeles, Central Park, Gibbon Conservation Center, Mountasia Family Fun Center, Tatsu, Valencia Heritage Park, Hart Park, William S Hart Museum, Newhall Park, Iron Horse Trailhead, Golden Valley Dog Park, Goliath, X², The Classic Revolution, The Riddler's Revenge, Hasley Canyon Trail, Dr. Richard H. Rioux Memorial Park, Downtown Newhall, Bouquet Canyon Park, Slide Mountain Fire Lookout Tower, Vaquero Beach At Pyramid Lake, Tumble Inn, West Kern Oil Museum, Laguna Mountain Recreation Area, Pinnacles National Park, waypoint one, Pinnacles National Park sign, Condor Gulch Overlook, Gilroy Gardens Family Theme Park, Kirigin Cellars, Satori Cellars, Rainbow Park, Los Arroyos Park, Gilroy Sports Park, Stefania Wine, Miramar Vineyards, Chitactac-Adams Heritage County Park, Christmas Hill Park, Sarah's Vineyard, Las Animas Park - Veterans Park, Wings of History Air Museum, Sunrise Park, Gilroy Museum, Live Oak Creamery, Old City Hall, Gilroy Free Library, Gaggle of Garlic Geese, Miller Park, Fair Oaks Park, Ponderosa Park, Lakewood Park, Braly Park, Seven Seas Park, Columbia Park, Murphy Park, Joshua Hendy Iron Works Museum, Sunnyvale art corner, Fairwood Park, Historic Murphy Avenue
