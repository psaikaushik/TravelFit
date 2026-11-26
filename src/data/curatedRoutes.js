import { calcDistance } from '../services/helpers'

// These original virtual paths connect approximate landmark locations.
// They are designed for progress on the map, not for navigation on foot.
export const VIRTUAL_ROUTES = [
  {
    id: 'central-park',
    title: 'Across Central Park',
    city: 'New York City',
    waypoints: [
      { name: 'Harlem Meer', latitude: 40.7977, longitude: -73.9519 },
      { name: 'Conservatory Garden', latitude: 40.7935, longitude: -73.9527 },
      { name: 'The Reservoir', latitude: 40.7868, longitude: -73.9602 },
      { name: 'The Met', latitude: 40.7794, longitude: -73.9632 }
    ]
  },
  {
    id: 'golden-gate',
    title: 'Golden Gate Waterfront',
    city: 'San Francisco',
    waypoints: [
      { name: 'Golden Gate Overlook', latitude: 37.8077, longitude: -122.4773 },
      { name: 'Torpedo Wharf', latitude: 37.8091, longitude: -122.4699 },
      { name: 'Crissy Field', latitude: 37.8047, longitude: -122.4609 }
    ]
  },
  {
    id: 'seattle-waterfront',
    title: 'Along the Seattle Waterfront',
    city: 'Seattle',
    waypoints: [
      { name: 'Olympic Sculpture Park', latitude: 47.6166, longitude: -122.3554 },
      { name: 'Pier 62', latitude: 47.6092, longitude: -122.3452 },
      { name: 'Seattle Aquarium', latitude: 47.6076, longitude: -122.3434 },
      { name: 'Pier 55', latitude: 47.6062, longitude: -122.3408 }
    ]
  }
]

export const buildCuratedTrip = ({ id, title, city, waypoints }) => {
  const [{ name: origin, latitude, longitude }] = waypoints
  const route = [{ latitude, longitude }]
  let distance = 0

  const badges = waypoints.slice(1).map((waypoint, index) => {
    const previous = waypoints[index]
    const segmentDistance = calcDistance(previous, waypoint)
    const count = Math.max(1, Math.ceil(segmentDistance / 0.03))
    for (let step = 1; step <= count; step++) {
      const fraction = step / count
      route.push({
        latitude: previous.latitude + (waypoint.latitude - previous.latitude) * fraction,
        longitude: previous.longitude + (waypoint.longitude - previous.longitude) * fraction
      })
    }
    distance += segmentDistance
    return {
      place_id: `${id}-${index + 1}`,
      name: waypoint.name,
      vicinity: city,
      coordinate: route[route.length - 1],
      distance,
      progress: 0
    }
  })

  return {
    curatedRouteId: id,
    title,
    starting: { title: origin, coordinate: route[0] },
    destination: { title: badges[badges.length - 1].name, coordinate: route[route.length - 1] },
    distance,
    route,
    breakPoints: badges.map(({ coordinate }) => coordinate),
    badges
  }
}

const CURATED_ROUTES = [
  {
    id: 'nyc-dc',
    title: 'New York to Washington D.C.',
    origin: { id: 'ChIJOwg_06VPwokRYv534QaPC8g', name: 'New York, NY, USA' },
    destination: { id: 'ChIJW-T2Wt7Gt4kRKl2I1CJFUsI', name: 'Washington, DC, USA' },
    distance: 364,
    description: 'Walk through the historic Northeast Corridor, passing Philadelphia and Baltimore.',
    difficulty: 'Medium',
    highlights: ['Philadelphia', 'Baltimore', 'Wilmington'],
    category: 'historic',
    estimatedDays: 45
  },
  {
    id: 'la-sf',
    title: 'Los Angeles to San Francisco',
    origin: { id: 'ChIJE9on3F3HwoAR9AhGJW_fL-I', name: 'Los Angeles, CA, USA' },
    destination: { id: 'ChIJIQBpAG2ahYAR_6128GcTUEo', name: 'San Francisco, CA, USA' },
    distance: 616,
    description: 'Journey up the California coast through scenic beaches and wine country.',
    difficulty: 'Hard',
    highlights: ['Santa Barbara', 'Big Sur', 'Monterey'],
    category: 'scenic',
    estimatedDays: 75
  },
  {
    id: 'london-paris',
    title: 'London to Paris',
    origin: { id: 'ChIJdd4hrwug2EcRmSrV3Vo6llI', name: 'London, UK' },
    destination: { id: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ', name: 'Paris, France' },
    distance: 461,
    description: 'Cross the English Channel on a virtual walk from London through Northern France to Paris.',
    difficulty: 'Hard',
    highlights: ['Canterbury', 'Calais', 'Amiens'],
    category: 'international',
    estimatedDays: 55
  },
  {
    id: 'boston-nyc',
    title: 'Boston to New York',
    origin: { id: 'ChIJGzE9DS1l44kRoOhiASS_fHg', name: 'Boston, MA, USA' },
    destination: { id: 'ChIJOwg_06VPwokRYv534QaPC8g', name: 'New York, NY, USA' },
    distance: 346,
    description: 'Walk through New England, past Hartford and along the Connecticut coast.',
    difficulty: 'Medium',
    highlights: ['Hartford', 'New Haven', 'Stamford'],
    category: 'historic',
    estimatedDays: 42
  },
  {
    id: 'rome-florence',
    title: 'Rome to Florence',
    origin: { id: 'ChIJu46S-ZZhLxMROG5lkwZ3D7k', name: 'Rome, Italy' },
    destination: { id: 'ChIJrdbSgKZWKhMRAyrH7xOOuGU', name: 'Florence, Italy' },
    distance: 274,
    description: 'Walk through the heart of Tuscany, past ancient hilltop towns and vineyards.',
    difficulty: 'Medium',
    highlights: ['Orvieto', 'Siena', 'San Gimignano'],
    category: 'scenic',
    estimatedDays: 34
  },
  {
    id: 'tokyo-kyoto',
    title: 'Tokyo to Kyoto',
    origin: { id: 'ChIJXSModoWLGGARILWiCfeu2M0', name: 'Tokyo, Japan' },
    destination: { id: 'ChIJ5UEMhhXhAWARkWJasmNiKBY', name: 'Kyoto, Japan' },
    distance: 476,
    description: 'Follow the ancient Tokaido road through Mt. Fuji country to the old imperial capital.',
    difficulty: 'Hard',
    highlights: ['Mt. Fuji', 'Nagoya', 'Lake Biwa'],
    category: 'international',
    estimatedDays: 58
  },
  {
    id: 'sydney-melbourne',
    title: 'Sydney to Melbourne',
    origin: { id: 'ChIJP3Sa8ziYEmsRUKgyFmh9AQM', name: 'Sydney, Australia' },
    destination: { id: 'ChIJ90260mVG1moRkM2MIXVWBAQ', name: 'Melbourne, Australia' },
    distance: 878,
    description: 'A grand coastal walk along southeastern Australia through beautiful beaches.',
    difficulty: 'Epic',
    highlights: ['Wollongong', 'Canberra', 'Great Ocean Road'],
    category: 'scenic',
    estimatedDays: 110
  },
  {
    id: 'chicago-stlouis',
    title: 'Chicago to St. Louis',
    origin: { id: 'ChIJ7cv00DwsDogRAMDACa2m4K8', name: 'Chicago, IL, USA' },
    destination: { id: 'ChIJ-Y3QjAA03YcRMCA0BQKG0HI', name: 'St. Louis, MO, USA' },
    distance: 480,
    description: 'Walk through the heartland along Route 66, past Springfield to the Gateway Arch.',
    difficulty: 'Hard',
    highlights: ['Joliet', 'Springfield', 'Gateway Arch'],
    category: 'historic',
    estimatedDays: 60
  }
]

const CATEGORIES = {
  all: 'All Routes',
  scenic: 'Scenic',
  historic: 'Historic',
  international: 'International'
}

const DIFFICULTY_COLORS = {
  Easy: 'green',
  Medium: 'orange',
  Hard: 'red',
  Epic: 'purple'
}

export { CURATED_ROUTES, CATEGORIES, DIFFICULTY_COLORS }
