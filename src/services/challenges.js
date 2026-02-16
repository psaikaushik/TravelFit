import AsyncStorage from '@react-native-async-storage/async-storage'
import moment from 'moment'

const STORAGE_KEY = 'walking_challenges'

const CHALLENGE_TEMPLATES = [
  {
    id: 'daily_10k',
    title: '10K Daily',
    description: 'Walk 10,000 steps today',
    type: 'daily',
    targetSteps: 10000,
    reward: 'Daily Walker'
  },
  {
    id: 'weekly_50k',
    title: 'Weekly Warrior',
    description: 'Walk 50,000 steps this week',
    type: 'weekly',
    targetSteps: 50000,
    reward: 'Weekly Warrior'
  },
  {
    id: 'weekly_100k',
    title: 'Century Week',
    description: 'Walk 100,000 steps this week',
    type: 'weekly',
    targetSteps: 100000,
    reward: 'Century Champion'
  },
  {
    id: 'monthly_marathon',
    title: 'Monthly Marathon',
    description: 'Walk a marathon distance (42.2 km) this month',
    type: 'monthly',
    targetSteps: 55000,
    reward: 'Marathon Master'
  },
  {
    id: 'monthly_200k',
    title: 'Monthly Legend',
    description: 'Walk 200,000 steps this month',
    type: 'monthly',
    targetSteps: 200000,
    reward: 'Monthly Legend'
  },
  {
    id: 'streak_7',
    title: '7-Day Streak',
    description: 'Walk at least 5,000 steps every day for 7 days',
    type: 'streak',
    targetSteps: 5000,
    streakDays: 7,
    reward: 'Streak Master'
  },
  {
    id: 'explorer',
    title: 'Explorer',
    description: 'Walk 15,000 steps in a single day',
    type: 'daily',
    targetSteps: 15000,
    reward: 'Explorer'
  },
  {
    id: 'monthly_500k',
    title: 'Ultra Walker',
    description: 'Walk 500,000 steps this month',
    type: 'monthly',
    targetSteps: 500000,
    reward: 'Ultra Walker'
  }
]

const getActiveChallenges = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw || raw === 'null') return []
    const challenges = JSON.parse(raw)
    return challenges.filter((challenge) => !isChallengeExpired(challenge))
  } catch (e) {
    console.log('getActiveChallenges error:', e)
    return []
  }
}

const joinChallenge = async (challengeId) => {
  try {
    const template = CHALLENGE_TEMPLATES.find((t) => t.id === challengeId)
    if (!template) return null

    const active = await getActiveChallenges()
    const alreadyJoined = active.find((c) => c.id === challengeId)
    if (alreadyJoined) return active

    const newChallenge = {
      ...template,
      startDate: moment().toISOString(),
      progress: 0,
      completed: false
    }

    const updated = [...active, newChallenge]
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (e) {
    console.log('joinChallenge error:', e)
    return null
  }
}

const updateChallengeProgress = async (challengeId, currentSteps) => {
  try {
    const active = await getActiveChallenges()
    const index = active.findIndex((c) => c.id === challengeId)
    if (index === -1) return active

    active[index].progress = currentSteps

    if (currentSteps >= active[index].targetSteps) {
      active[index].completed = true
      await completeChallenge(active[index])
      const remaining = active.filter((c) => c.id !== challengeId)
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remaining))
      return remaining
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(active))
    return active
  } catch (e) {
    console.log('updateChallengeProgress error:', e)
    return []
  }
}

const getCompletedChallenges = async () => {
  try {
    const raw = await AsyncStorage.getItem('completed_challenges')
    if (!raw || raw === 'null') return []
    return JSON.parse(raw)
  } catch (e) {
    console.log('getCompletedChallenges error:', e)
    return []
  }
}

const completeChallenge = async (challenge) => {
  try {
    const completed = await getCompletedChallenges()
    const entry = {
      ...challenge,
      completed: true,
      completedDate: moment().toISOString()
    }
    const updated = [...completed, entry]
    await AsyncStorage.setItem('completed_challenges', JSON.stringify(updated))
    return updated
  } catch (e) {
    console.log('completeChallenge error:', e)
    return []
  }
}

const getChallengeEndDate = (challenge) => {
  const start = moment(challenge.startDate)
  switch (challenge.type) {
    case 'daily':
      return moment(start).endOf('day')
    case 'weekly':
      return moment(start).endOf('week')
    case 'monthly':
      return moment(start).endOf('month')
    case 'streak':
      return moment(start).add(challenge.streakDays || 7, 'days').endOf('day')
    default:
      return moment(start).endOf('day')
  }
}

const isChallengeExpired = (challenge) => {
  const endDate = getChallengeEndDate(challenge)
  return moment().isAfter(endDate)
}

export {
  CHALLENGE_TEMPLATES,
  getActiveChallenges,
  joinChallenge,
  updateChallengeProgress,
  getCompletedChallenges,
  completeChallenge,
  getChallengeEndDate,
  isChallengeExpired
}
