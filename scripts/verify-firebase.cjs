const assert = require('node:assert/strict')
const rules = require('../database.rules.json')

const project = 'demo-travelfit-audit'
const authOrigin = 'http://127.0.0.1:19099'
const databaseOrigin = 'http://127.0.0.1:19000'
const functionsOrigin = 'http://127.0.0.1:19501'
const tag = Date.now()
const email = `walker-${tag}@example.invalid`
const password = 'initial-pass-123'
const nextPassword = 'replacement-pass-456'

async function request(url, { method = 'GET', token, body, status = 200 } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      ...(token && { authorization: `Bearer ${token}` }),
      ...(body !== undefined && { 'content-type': 'application/json' })
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000)
  })
  const { origin, pathname } = new URL(url)
  const requestLabel = `${method} ${origin}${pathname}`
  assert.equal(response.status, status, `${requestLabel} returned an unexpected status`)
  try {
    return await response.json()
  } catch {
    throw new Error(`${requestLabel} returned an invalid JSON response`)
  }
}

const auth = (action, body, status) => request(
  `${authOrigin}/identitytoolkit.googleapis.com/v1/accounts:${action}?key=local-key`,
  { method: 'POST', body, status }
)

const databaseRecord = (path, { token, ...options } = {}) => {
  const url = new URL(`/${path}.json`, databaseOrigin)
  url.searchParams.set('ns', project)
  if (token && token !== 'owner') url.searchParams.set('auth', token)
  return request(url, { ...options, token: token === 'owner' ? token : undefined })
}

const profile = (uid, options) => databaseRecord(`users/${uid}`, options)
const deletionMarker = (uid, options) => databaseRecord(`account_deletions/${uid}`, options)

const removeAccount = (token, expectedUid, status) => request(
  `${functionsOrigin}/${project}/us-central1/deleteAccount`,
  { method: 'POST', token, body: { data: { expectedUid } }, status }
)

function staleEmulatorToken(token) {
  const [header, payload, signature] = token.split('.')
  assert.equal(signature, '')
  assert.equal(JSON.parse(Buffer.from(header, 'base64url')).alg, 'none')
  const claims = JSON.parse(Buffer.from(payload, 'base64url'))
  claims.auth_time -= 6 * 60
  return `${header}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.`
}

async function main() {
  const rulesUrl = new URL('/.settings/rules.json', databaseOrigin)
  rulesUrl.searchParams.set('ns', project)
  await request(rulesUrl, { method: 'PUT', token: 'owner', body: rules })

  const newAccount = await auth('signUp', { email, password, returnSecureToken: true })
  const secondEmail = `other-${tag}@example.invalid`
  const secondAccount = await auth('signUp', {
    email: secondEmail,
    password,
    returnSecureToken: true
  })
  assert.ok(newAccount.localId)
  const uid = newAccount.localId
  const data = { name: 'Demo Walker', email, createdTime: new Date().toISOString() }
  await profile(uid, { method: 'PUT', token: newAccount.idToken, body: data })
  assert.deepEqual(await profile(uid, { token: newAccount.idToken }), data)
  await profile(uid, { token: secondAccount.idToken, status: 401 })

  await auth('sendOobCode', { requestType: 'PASSWORD_RESET', email })
  const { oobCodes } = await request(`${authOrigin}/emulator/v1/projects/${project}/oobCodes`)
  const reset = oobCodes.find((code) => code.email === email && code.requestType === 'PASSWORD_RESET')
  assert.ok(reset, 'Auth emulator issued a reset code for the demo address')
  await auth('resetPassword', { oobCode: reset.oobCode, newPassword: nextPassword })
  await auth('signInWithPassword', { email, password, returnSecureToken: true }, 400)
  const signedIn = await auth('signInWithPassword', {
    email, password: nextPassword, returnSecureToken: true
  })
  assert.equal(signedIn.localId, uid)
  assert.deepEqual(await profile(uid, { token: signedIn.idToken }), data)

  await removeAccount(undefined, uid, 401)
  const mismatch = await removeAccount(secondAccount.idToken, uid, 400)
  assert.equal(mismatch.error.status, 'FAILED_PRECONDITION')
  assert.deepEqual(await profile(uid, { token: signedIn.idToken }), data)

  const stale = await removeAccount(staleEmulatorToken(signedIn.idToken), uid, 400)
  assert.equal(stale.error.status, 'FAILED_PRECONDITION')
  assert.match(stale.error.message, /sign out and sign in again/i)
  assert.equal(await deletionMarker(uid, { token: 'owner' }), null)
  await deletionMarker(uid, { token: signedIn.idToken, status: 401 })
  await deletionMarker(uid, { token: signedIn.idToken, method: 'PUT', body: true, status: 401 })

  const billing = { customerId: 'legacy-billing-fixture' }
  await databaseRecord(`stripe_customers/${uid}`, { method: 'PUT', token: 'owner', body: billing })
  const legacy = await removeAccount(signedIn.idToken, uid, 400)
  assert.equal(legacy.error.status, 'FAILED_PRECONDITION')
  assert.match(legacy.error.message, /legacy billing/i)
  assert.equal(await deletionMarker(uid, { token: 'owner' }), null)
  assert.deepEqual(await profile(uid, { token: signedIn.idToken }), data)
  await databaseRecord(`stripe_customers/${uid}`, { method: 'DELETE', token: 'owner' })

  const secondUid = secondAccount.localId
  const secondProfile = { ...data, email: secondEmail }
  await profile(secondUid, { method: 'PUT', token: secondAccount.idToken, body: secondProfile })
  // Simulate the atomic database step succeeding before Auth deletion was interrupted.
  await databaseRecord('', {
    method: 'PATCH',
    token: 'owner',
    body: { [`account_deletions/${secondUid}`]: true, [`users/${secondUid}`]: null }
  })
  const staleSecondToken = staleEmulatorToken(secondAccount.idToken)
  assert.equal(await deletionMarker(secondUid, { token: staleSecondToken }), true)
  await deletionMarker(secondUid, { token: signedIn.idToken, status: 401 })
  await deletionMarker(secondUid, { status: 401 })
  await databaseRecord('account_deletions', { token: staleSecondToken, status: 401 })
  await deletionMarker(secondUid, { token: staleSecondToken, method: 'DELETE', status: 401 })
  await profile(secondUid, { token: staleSecondToken, status: 401 })
  await profile(secondUid, { token: staleSecondToken, method: 'PUT', body: secondProfile, status: 401 })
  const mismatchRetry = await removeAccount(signedIn.idToken, secondUid, 400)
  assert.equal(mismatchRetry.error.status, 'FAILED_PRECONDITION')
  await auth('signInWithPassword', { email: secondEmail, password, returnSecureToken: true })
  assert.deepEqual(await removeAccount(staleSecondToken, secondUid), { result: { deleted: true } })
  assert.equal(await profile(secondUid, { token: 'owner' }), null)
  await auth('signInWithPassword', { email: secondEmail, password, returnSecureToken: true }, 400)

  assert.deepEqual(await removeAccount(signedIn.idToken, uid), { result: { deleted: true } })
  assert.equal(await profile(uid, { token: 'owner' }), null)
  await auth('signInWithPassword', { email, password: nextPassword, returnSecureToken: true }, 400)
  await profile(uid, { method: 'PUT', token: signedIn.idToken, body: data, status: 401 })
  console.log('Firebase emulator passed profile isolation, password reset, guarded deletion, and interrupted-deletion recovery.')
}

async function runCheck() {
  switch (process.argv[2]) {
    case 'simulator-ready': {
      const response = await removeAccount(undefined, 'simulator-readiness-probe', 401)
      assert.equal(response.error.status, 'UNAUTHENTICATED')
      console.log('The simulator account-deletion function is available.')
      break
    }
    case 'simulator-report': {
      const accountsUrl = `${authOrigin}/identitytoolkit.googleapis.com/v1/projects/${project}/accounts:batchGet`
      const { users = [] } = await request(accountsUrl, { token: 'owner' })
      const testUsers = users.filter(({ email }) => email?.startsWith('travelfit-e2e-'))
      const profiles = await Promise.all(testUsers.map(({ localId }) => profile(localId, { token: 'owner' })))
      console.log(`Simulator persisted ${testUsers.length} synthetic Auth accounts and ${profiles.filter(Boolean).length} profiles.`)
      break
    }
    case undefined:
      await main()
      break
    default:
      throw new Error('Unknown Firebase emulator check.')
  }
}

runCheck().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
