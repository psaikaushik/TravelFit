const functions = require('firebase-functions')
const admin = require('firebase-admin')
const axios = require('axios')
const stripe = require('stripe')(functions.config().stripe.secret_key)

// Google Maps API key — set via: firebase functions:config:set google.maps_key="YOUR_KEY"
const GOOGLE_MAPS_KEY = functions.config().google?.maps_key || ''

admin.initializeApp()

// ============================================================
// 1. CREATE STRIPE CUSTOMER
// Called after signup — links Firebase UID to a Stripe Customer
// ============================================================
exports.createCustomer = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in')
  }

  const uid = context.auth.uid
  const email = data.email || context.auth.token.email
  const name = data.name || context.auth.token.name || ''

  // Check if customer already exists in our database
  const userRef = admin.database().ref(`stripe_customers/${uid}`)
  const snapshot = await userRef.once('value')

  if (snapshot.exists()) {
    const existingCustomerId = snapshot.val().customerId
    return { customerId: existingCustomerId }
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { firebaseUID: uid }
  })

  // Store the Stripe customer ID in Firebase
  await userRef.set({
    customerId: customer.id,
    email,
    createdAt: admin.database.ServerValue.TIMESTAMP
  })

  return { customerId: customer.id }
})

// ============================================================
// 2. CREATE SETUP INTENT
// Returns a clientSecret so the app can securely collect card
// details via Stripe SDK (PCI compliant — card never touches server)
// ============================================================
exports.createSetupIntent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in')
  }

  const uid = context.auth.uid

  // Get the Stripe customer ID
  const customerSnapshot = await admin.database()
    .ref(`stripe_customers/${uid}/customerId`)
    .once('value')

  if (!customerSnapshot.exists()) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'No Stripe customer found. Call createCustomer first.'
    )
  }

  const customerId = customerSnapshot.val()

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
    metadata: { firebaseUID: uid }
  })

  return {
    clientSecret: setupIntent.client_secret,
    setupIntentId: setupIntent.id
  }
})

// ============================================================
// 3. CREATE SUBSCRIPTION
// Creates a Stripe Subscription with a 3-day free trial.
// The card on file (from SetupIntent) gets charged on day 4.
// ============================================================
exports.createSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in')
  }

  const uid = context.auth.uid
  const { priceId } = data

  if (!priceId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'priceId is required'
    )
  }

  // Get the Stripe customer ID
  const customerSnapshot = await admin.database()
    .ref(`stripe_customers/${uid}/customerId`)
    .once('value')

  if (!customerSnapshot.exists()) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'No Stripe customer found. Call createCustomer first.'
    )
  }

  const customerId = customerSnapshot.val()

  // Retrieve the customer to get the default payment method
  const customer = await stripe.customers.retrieve(customerId)

  if (!customer.invoice_settings.default_payment_method) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'No payment method on file. Complete card setup first.'
    )
  }

  // Create subscription with 3-day trial
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: 3,
    default_payment_method: customer.invoice_settings.default_payment_method,
    metadata: { firebaseUID: uid },
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent']
  })

  // Store subscription info in Firebase
  await admin.database().ref(`stripe_customers/${uid}/subscription`).set({
    subscriptionId: subscription.id,
    priceId,
    status: subscription.status,
    trialStart: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trialEnd: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    createdAt: admin.database.ServerValue.TIMESTAMP
  })

  return {
    subscriptionId: subscription.id,
    status: subscription.status,
    trialEnd: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null
  }
})

// ============================================================
// 4. GET SUBSCRIPTION STATUS
// Returns the user's current subscription state from Firebase
// (kept in sync by webhooks)
// ============================================================
exports.getSubscriptionStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in')
  }

  const uid = context.auth.uid

  const snapshot = await admin.database()
    .ref(`stripe_customers/${uid}/subscription`)
    .once('value')

  if (!snapshot.exists()) {
    return { isSubscribed: false, subscription: null }
  }

  const subscription = snapshot.val()
  const now = new Date()
  const trialEnd = subscription.trialEnd ? new Date(subscription.trialEnd) : null
  const periodEnd = new Date(subscription.currentPeriodEnd)

  const isInTrial = trialEnd && now < trialEnd
  const isActive = ['active', 'trialing'].includes(subscription.status)

  return {
    isSubscribed: isActive,
    isInTrial,
    subscription: {
      ...subscription,
      isActive,
      isInTrial
    }
  }
})

// ============================================================
// 5. CANCEL SUBSCRIPTION
// ============================================================
exports.cancelSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in')
  }

  const uid = context.auth.uid

  const snapshot = await admin.database()
    .ref(`stripe_customers/${uid}/subscription/subscriptionId`)
    .once('value')

  if (!snapshot.exists()) {
    throw new functions.https.HttpsError('not-found', 'No active subscription')
  }

  const subscriptionId = snapshot.val()

  // Cancel at end of current period (user keeps access until then)
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true
  })

  await admin.database().ref(`stripe_customers/${uid}/subscription`).update({
    status: subscription.status,
    cancelAtPeriodEnd: true,
    canceledAt: admin.database.ServerValue.TIMESTAMP
  })

  return { success: true }
})

// ============================================================
// 6. STRIPE WEBHOOK HANDLER
// Keeps Firebase in sync with Stripe's source of truth
// ============================================================
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature']
  const endpointSecret = functions.config().stripe.webhook_secret

  let event
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  const handleSubscriptionEvent = async (subscription) => {
    const firebaseUID = subscription.metadata.firebaseUID
    if (!firebaseUID) {
      console.warn('No firebaseUID in subscription metadata')
      return
    }

    await admin.database().ref(`stripe_customers/${firebaseUID}/subscription`).update({
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    })
  }

  switch (event.type) {
    // Subscription lifecycle events
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await handleSubscriptionEvent(event.data.object)
      break

    // Trial ending soon — good place to trigger a push notification
    case 'customer.subscription.trial_will_end': {
      const subscription = event.data.object
      const firebaseUID = subscription.metadata.firebaseUID
      if (firebaseUID) {
        await admin.database()
          .ref(`stripe_customers/${firebaseUID}/subscription`)
          .update({ trialEndingSoon: true })
      }
      break
    }

    // Payment succeeded
    case 'invoice.paid': {
      const invoice = event.data.object
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
        await handleSubscriptionEvent(subscription)
      }
      break
    }

    // Payment failed
    case 'invoice.payment_failed': {
      const invoice = event.data.object
      const firebaseUID = invoice.metadata?.firebaseUID
      if (firebaseUID || invoice.subscription) {
        const subscription = invoice.subscription
          ? await stripe.subscriptions.retrieve(invoice.subscription)
          : null
        const uid = firebaseUID || subscription?.metadata?.firebaseUID
        if (uid) {
          await admin.database()
            .ref(`stripe_customers/${uid}/subscription`)
            .update({
              status: 'past_due',
              paymentFailed: true,
              lastPaymentError: invoice.last_payment_error?.message || 'Payment failed',
              updatedAt: admin.database.ServerValue.TIMESTAMP
            })
        }
      }
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  res.json({ received: true })
})

// ============================================================
// 7. GOOGLE MAPS API PROXIES
// All Maps API calls go through the backend so the API key
// is never exposed in the client app.
// ============================================================

const mapsGet = async (url, params) => {
  const response = await axios.get(url, {
    params: { ...params, key: GOOGLE_MAPS_KEY },
    timeout: 30000
  })
  return response.data
}

exports.mapsGetRoute = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in')
  }
  return mapsGet('https://maps.googleapis.com/maps/api/directions/json', {
    origin: data.origin,
    destination: data.destination,
    mode: 'walking',
    units: 'metric'
  })
})

exports.mapsGetNearbyPlaces = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in')
  }
  return mapsGet('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
    location: data.location,
    radius: data.radius,
    type: 'tourist_attraction'
  })
})

exports.mapsGetLocationDetails = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in')
  }
  return mapsGet('https://maps.googleapis.com/maps/api/geocode/json', {
    latlng: data.latlng
  })
})

exports.mapsGetCityDetails = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in')
  }
  return mapsGet('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
    input: data.input,
    types: '(cities)'
  })
})

exports.mapsGetPlaceDetails = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in')
  }
  return mapsGet('https://maps.googleapis.com/maps/api/place/details/json', {
    place_id: data.placeId,
    fields: data.fields || 'photo'
  })
})

// ============================================================
// 8. PLACE PHOTO PROXY
// HTTP endpoint that proxies Google Places Photos so the API
// key is never exposed in image URLs on the client.
// Usage: https://<region>-<project>.cloudfunctions.net/placePhoto?ref=XXX&maxwidth=400
// ============================================================
exports.placePhoto = functions.https.onRequest(async (req, res) => {
  const { ref, maxwidth, maxheight } = req.query

  if (!ref) {
    return res.status(400).send('Missing ref parameter')
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/photo',
      {
        params: {
          photoreference: ref,
          maxwidth: maxwidth || '400',
          maxheight: maxheight || '400',
          key: GOOGLE_MAPS_KEY
        },
        responseType: 'stream',
        maxRedirects: 5
      }
    )

    res.set('Content-Type', response.headers['content-type'] || 'image/jpeg')
    res.set('Cache-Control', 'public, max-age=86400')
    response.data.pipe(res)
  } catch (error) {
    console.error('placePhoto error:', error.message)
    res.status(500).send('Failed to fetch photo')
  }
})
