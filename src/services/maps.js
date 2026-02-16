import {
  mapsGetRoute,
  mapsGetNearbyPlaces,
  mapsGetLocationDetails,
  mapsGetCityDetails,
  mapsGetPlaceDetails
} from './api'
import {
  calcBreakpointsProgress,
  calcProgress,
  getDestinationStep,
  getRadius,
  getTopPlace
} from './helpers'

export const getRoute = async (origin, destination) => {
  return mapsGetRoute(
    `${origin.latitude},${origin.longitude}`,
    `${destination.latitude},${destination.longitude}`
  )
}

export const getNearbyPlaces = async (location, radius = 20000) => {
  return mapsGetNearbyPlaces(
    `${location.latitude},${location.longitude}`,
    radius
  )
}

export const getLocationDetails = async (location) => {
  try {
    return await mapsGetLocationDetails(
      `${location.latitude},${location.longitude}`
    )
  } catch (e) {
    console.log('getLocationDetails', e)
    return { results: [] }
  }
}

export const getCityDetails = async (name) => {
  return mapsGetCityDetails(name)
}

export const getPlaceDetails = async (id, fields = 'photo') => {
  return mapsGetPlaceDetails(id, fields)
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
  const radius = getRadius(distance)
  const diameter = radius * 2

  console.log('radius', radius)

  let i = 0
  let l = 0
  while (i < route.length - 1) {
    const point = route[i]
    let closest = i + 1
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
    breakPoints.forEach((item) => {
      promises.push(getNearbyPlaces(item, radius * 1000))
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
          place = getTopPlace(filtered)
        } else if (filtered.length === 1) {
          place = filtered[0]
        }
        if (!!place) {
          placeKeys[place.place_id] = true
          console.log('point', i, place?.name || '-')
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

  places = calcBreakpointsProgress(
    progressIdx,
    destinationPoint,
    route,
    breakPoints,
    places,
    radius
  )

  return { breakPoints, places }
}

export default { getRoute, getNearbyPlaces, getLocationDetails, getPlaces }
