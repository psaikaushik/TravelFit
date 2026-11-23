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
  const result = await response.json()
  assert.equal(response.status, status, JSON.stringify(result))
  return result
}

const auth = (action, body, status) => request(
  `${authOrigin}/identitytoolkit.googleapis.com/v1/accounts:${action}?key=local-key`,
  { method: 'POST', body, status }
)

const profile = (uid, { token, ...options } = {}) => {
  const url = new URL(`/users/${uid}.json`, databaseOrigin)
  url.searchParams.set('ns', project)
  if (token && token !== 'owner') url.searchParams.set('auth', token)
  return request(url, { ...options, token: token === 'owner' ? token : undefined })
}

const removeAccount = (token, status) => request(
  `${functionsOrigin}/${project}/us-central1/deleteAccount`,
  { method: 'POST', token, body: { data: {} }, status }
)

async function main() {
  const rulesUrl = new URL('/.settings/rules.json', databaseOrigin)
  rulesUrl.searchParams.set('ns', project)
  await request(rulesUrl, { method: 'PUT', token: 'owner', body: rules })

  const newAccount = await auth('signUp', { email, password, returnSecureToken: true })
  const secondAccount = await auth('signUp', {
    email: `other-${tag}@example.invalid`,
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

  await removeAccount(undefined, 401)
  assert.deepEqual(await removeAccount(signedIn.idToken), { result: { deleted: true } })
  assert.equal(await profile(uid, { token: 'owner' }), null)
  await auth('signInWithPassword', { email, password: nextPassword, returnSecureToken: true }, 400)
  await profile(uid, { method: 'PUT', token: signedIn.idToken, body: data, status: 401 })
  console.log('Firebase emulator passed signup, profile isolation, reset and login, account deletion, and stale-token denial.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
