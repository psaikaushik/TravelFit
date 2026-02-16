import { hasActiveSubscription } from './subscription'

const FREE_TIER_LIMITS = {
  maxRoutes: 1,
  maxChallenges: 2,
  statsAccess: 'weekly',
  curatedRoutes: 3,
  shareProgress: false,
  notificationCustomization: false,
  walkingChallenges: 2
}

const PREMIUM_FEATURES = {
  maxRoutes: Infinity,
  maxChallenges: Infinity,
  statsAccess: 'full',
  curatedRoutes: Infinity,
  shareProgress: true,
  notificationCustomization: true,
  walkingChallenges: Infinity
}

const FREE_FEATURES_LIST = [
  'One active route',
  'Basic step tracking',
  'Weekly statistics',
  'Up to 3 curated routes',
  '2 walking challenges',
  'Landmark & city badges'
]

const PREMIUM_FEATURES_LIST = [
  'Unlimited routes & trip history',
  'Full weekly + monthly stats',
  'All curated routes worldwide',
  'Unlimited walking challenges',
  'Share progress cards',
  'Custom notification settings',
  'Priority support'
]

const getFeatureLimits = async () => {
  const isSubscribed = await hasActiveSubscription()
  return isSubscribed ? PREMIUM_FEATURES : FREE_TIER_LIMITS
}

const canAccessFeature = async (feature) => {
  const isSubscribed = await hasActiveSubscription()
  if (isSubscribed) return { allowed: true }

  switch (feature) {
    case 'monthly_stats':
      return { allowed: false, reason: 'Upgrade to Premium for monthly statistics' }
    case 'share_progress':
      return { allowed: false, reason: 'Upgrade to Premium to share your progress' }
    case 'notification_settings':
      return { allowed: false, reason: 'Upgrade to Premium for custom notifications' }
    case 'unlimited_challenges':
      return { allowed: false, reason: 'Upgrade to Premium for unlimited challenges' }
    case 'all_curated_routes':
      return { allowed: false, reason: 'Upgrade to Premium for all curated routes' }
    case 'trip_history':
    case 'basic_stats':
    case 'basic_challenges':
      return { allowed: true }
    default:
      return { allowed: true }
  }
}

export {
  FREE_TIER_LIMITS,
  PREMIUM_FEATURES,
  FREE_FEATURES_LIST,
  PREMIUM_FEATURES_LIST,
  getFeatureLimits,
  canAccessFeature
}
