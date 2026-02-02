const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

admin.initializeApp();

const stripe = Stripe(functions.config().stripe.secret); // Set via Firebase CLI

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.raw({ type: 'application/json' })); // Needed for webhook signature

// ---------------------------------------- Old Code Start ----------------------------------------

/**
 * Create a new Stripe customer for a Firebase user
 * Required in client: uid, email
 */
// app.post('/createCustomer', async (req, res) => {
//   const { uid, email } = req.body;
//   console.log('[createCustomer] Request body:', req.body);
//   if (!uid || !email) return res.status(400).send({ error: 'Missing uid or email' });

//   try {
//     const customer = await stripe.customers.create({ email });
//     const userRef = admin.firestore().doc(`users/${uid}`);
//     const userSnap = await userRef.get();

//     if (userSnap.exists) {
//       await userRef.update({ stripeCustomerId: customer.id });
//     } else {
//       await userRef.set({ stripeCustomerId: customer.id }, { merge: true });
//     }
//     console.log(`[createCustomer] Saved stripeCustomerId ${customer.id} for uid ${uid}`);
//     res.send({ customerId: customer.id });
//   } catch (err) {
//     console.error('[createCustomer]', err);
//     res.status(500).send({ error: err.message });
//   }
// });

/**
 * Create a subscription for a customer
 * Required in client: customerId
 */
// app.post('/createSubscription', async (req, res) => {
//   const { customerId } = req.body;
//   console.log('[createSubscription] Request body:', req.body);
//   if (!customerId) return res.status(400).send({ error: 'Missing customerId' });

//   try {
//     // Get Firebase UID from customer mapping
//     const userSnap = await admin.firestore().collection('users')
//       .where('stripeCustomerId', '==', customerId).limit(1).get();

//     if (userSnap.empty) return res.status(404).send({ error: 'User not found for customerId' });

//     const uid = userSnap.docs[0].id;

//     const subscription = await stripe.subscriptions.create({
//       customer: customerId,
//       items: [{ price: 'price_1RYFduQB98H4cpXDUgYhNZnb' }], // Replace with your actual price ID
//       payment_behavior: 'default_incomplete',
//       expand: ['latest_invoice.payment_intent'],
//       metadata: { firebaseUID: uid },
//       payment_settings: {
//         payment_method_types: ['card'], // 🔐 Ensures a PaymentIntent is created
//         save_default_payment_method: 'on_subscription', // ✅ Add this line
//       },
//     });
//     const paymentIntent = subscription.latest_invoice?.payment_intent;
//     if (!paymentIntent || !paymentIntent.client_secret) {
//       console.error('❌ Missing client_secret:', subscription.latest_invoice);
//       throw new Error('Stripe subscription missing payment intent.');
//     }
//     const ephemeralKey = await stripe.ephemeralKeys.create(
//       { customer: customerId },
//       { apiVersion: '2025-05-28.basil' } // Match your Stripe version
//     );

//     res.send({
//       clientSecret: paymentIntent.client_secret,
//       ephemeralKey: ephemeralKey.secret,
//       customerId,
//     });
//   } catch (error) {
//     console.error('[createSubscription]', error);
//     res.status(400).send({ error: error.message });
//   }
// });

// ---------------------------------------- Old Code End ----------------------------------------

const updateStripeCustomerIdInFirebase = async (uid, customerId) => {
  try {
    const userRef = admin.firestore().doc(`users/${uid}`);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
      await userRef.update({ stripeCustomerId: customerId });
    } else {
      await userRef.set({ stripeCustomerId: customerId }, { merge: true });
    }
  } catch (error) {
    console.log(error);
  }
}

// Create customer (Step 1)
app.post('/createCustomer', async (req, res) => {
  try {
    const { uid, email } = req.body;

    if (!uid) return res.status(400).send({ error: 'Missing uid' });

    const customer = await stripe.customers.create({ email: email ?? `${uid}@stripe.com` });

    await updateStripeCustomerIdInFirebase(uid, customer.id);

    res.send({ customerId: customer.id });
  } catch (err) {
    console.log('[createCustomer]', err);
    res.status(500).send({ error: err.message });
  }
});



// Create subscription (Step 2)
app.post('/payment-sheet', async (req, res) => {
  try {
    const { customerId, type, } = req.body;

    if (!customerId) return res.status(400).send({ error: 'Missing customerId' });

    const userSnap = await admin.firestore().collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();

    if (userSnap?.empty) return res.status(404).send({ error: 'User not found for customerId' });

    const uid = userSnap.docs[0].id;

    const priceIds = {
      usd: 'price_1RdQj7QB98H4cpXDIOk9peUd',
      dkk: 'price_1RdQj7QB98H4cpXDHhZu5Tcv',
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceIds[type] }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: { firebaseUID: uid },
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
    });

    let paymentIntent = subscription.latest_invoice?.payment_intent;

    // If still no payment intent, create manually
    if (!paymentIntent) {
      paymentIntent = await stripe.paymentIntents.create({
        amount: subscription.latest_invoice.amount_due,
        currency: 'usd',
        customer: customerId,
        description: `Manual payment for subscription ${subscription.id}`,
      });
    }

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2023-10-16' }
    );

    res.send({
      paymentIntent: paymentIntent?.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customerId,
      subscriptionId: subscription.id,
    });
  } catch (err) {
    console.log('[payment-sheet]', err);
    res.status(500).send({ error: err.message });
  }
});

app.post('/payment-complete', async (req, res) => {
  try {
    const { customerId, subscriptionId } = req.body;

    if (!customerId) return res.status(400).send({ error: 'Missing customerId' });

    const userSnap = await admin.firestore()
      .collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (userSnap?.empty) return res.status(404).send({ error: 'User not found for customerId' });

    const userDocRef = userSnap.docs[0].ref;

    await userDocRef.update({
      subscriptionStatus: 'active',
      subscriptionId,
      lastSubscriptionTime: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.send({ success: true });
  } catch (err) {
    console.log('[payment-complete]', err);
    res.status(500).send({ error: err.message });
  }
});

// Cancel Subscription
app.post('/cancel-subscription', async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).send({ error: 'Missing customerId' });
    }

    // Find the user by customerId
    const userSnap = await admin
      .firestore()
      .collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (userSnap.empty) {
      return res.status(404).send({ error: 'User not found for customerId' });
    }

    const userDoc = userSnap.docs[0];
    const { subscriptionId } = userDoc.data();

    if (!subscriptionId) {
      return res.status(400).send({ error: 'No active subscription found.' });
    }

    // Cancel subscription immediately or at period end
    const canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true, // ✅ Cancels at the end of the billing period
      // If you want immediate cancelation, use: cancel_at_period_end: false
    });

    // Update Firestore
    await userDoc.ref.update({
      subscriptionStatus: canceledSubscription.status, // e.g., "active" → "canceled"
    });

    res.send({ success: true, status: canceledSubscription.status });
  } catch (err) {
    console.log('[cancel-subscription]', err);
    res.status(500).send({ error: err.message });
  }
});


/**
 * Stripe webhook to handle subscription events
 */
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      functions.config().stripe.webhook_secret
    );
  } catch (err) {
    console.log('[webhook] Signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const subscription = event.data.object;
  const uid = subscription.metadata?.firebaseUID;

  if (!uid) {
    console.warn('[webhook] Missing firebaseUID in metadata.');
    return res.status(400).send({ error: 'Missing firebaseUID in metadata' });
  }

  const userRef = admin.firestore().doc(`users/${uid}`);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await userRef.update({
          subscriptionStatus: subscription.status, // e.g., 'active', 'trialing', 'past_due'
          subscriptionId: subscription.id,
          coursesLimit: 10, // Example premium feature
        });
        break;

      case 'customer.subscription.deleted':
        await userRef.update({
          subscriptionStatus: 'inactive',
          subscriptionId: admin.firestore.FieldValue.delete(),
          coursesLimit: 1,
        });
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.log('[webhook] Firestore update error:', err);
    res.status(500).send({ error: 'Internal error updating Firestore' });
  }
});

// Export a single Express app with all endpoints
exports.api = functions.region('europe-central2').https.onRequest(app);