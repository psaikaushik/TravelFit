const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getDatabase } = require('firebase-admin/database')
const { HttpsError, onCall } = require('firebase-functions/v2/https')

initializeApp()

const recentSignInSeconds = 5 * 60

const requireAccount = (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in to continue.')
  }
  return request.auth.uid
}

exports.deleteAccount = onCall(async (request) => {
  const uid = requireAccount(request)
  if (request.data?.expectedUid !== uid) {
    throw new HttpsError(
      'failed-precondition',
      'The signed-in account changed. Open Profile and try again.'
    )
  }
  const authTime = request.auth.token.auth_time
  if (!Number.isFinite(authTime) || Date.now() / 1000 - authTime > recentSignInSeconds) {
    throw new HttpsError(
      'failed-precondition',
      'Sign out and sign in again before deleting your account.'
    )
  }

  const database = getDatabase()
  if ((await database.ref(`stripe_customers/${uid}`).get()).exists()) {
    throw new HttpsError(
      'failed-precondition',
      'This account has legacy billing records. Contact TravelFit support to close the account and resolve billing.'
    )
  }

  // Mark the account before deleting Auth so outstanding tokens cannot recreate the profile.
  // Keep this marker server-only. The beta stores no social, health, or payment data.
  await database.ref().update({
    [`account_deletions/${uid}`]: true,
    [`users/${uid}`]: null
  })

  try {
    await getAuth().deleteUser(uid)
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      throw new HttpsError('unavailable', 'Account deletion could not finish. Try again.')
    }
  }

  return { deleted: true }
})
