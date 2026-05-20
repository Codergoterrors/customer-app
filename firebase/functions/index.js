// Firebase Cloud Functions for FoodApp
// Deploy with: firebase deploy --only functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const http = require('http');
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// ===================== ORDER TRIGGERS =====================

/**
 * onOrderCreated — Triggered when a new order document is created
 * Sends push notification to customer confirming order placement
 */
exports.onOrderCreated = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const { customerId, orderId } = order;

    try {
      // Get customer FCM token
      const userDoc = await db.collection('users').doc(customerId).get();
      if (!userDoc.exists) return;
      const userData = userDoc.data();
      const fcmToken = userData.fcmToken;

      if (fcmToken) {
        await messaging.send({
          token: fcmToken,
          notification: {
            title: 'Order Placed! 🎉',
            body: 'Your order has been sent to the restaurant. Hang tight!',
          },
          data: {
            type: 'order_update',
            orderId: context.params.orderId,
            status: 'PLACED',
          },
          android: {
            notification: {
              channelId: 'orders',
              priority: 'high',
              sound: 'default',
            },
          },
        });
      }

      // Create notification document
      await db
        .collection('notifications')
        .doc(customerId)
        .collection('items')
        .add({
          title: 'Order Placed!',
          body: 'Your order has been sent to the restaurant.',
          type: 'order',
          orderId: context.params.orderId,
          isRead: false,
          iconType: 'order',
          createdAt: Date.now(),
          deepLink: `foodapp://order/${context.params.orderId}`,
        });

      console.log(`Notification sent for new order ${context.params.orderId}`);
    } catch (error) {
      console.error('Error sending order created notification:', error);
    }
  });

/**
 * onOrderStatusUpdated — Triggered when order status changes
 * Sends status-specific push notification to customer
 */
exports.onOrderStatusUpdated = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only proceed if status actually changed
    if (before.status === after.status) return;

    const { customerId } = after;
    const newStatus = after.status;
    const riderName = after.riderName || 'Your rider';

    // Status-specific notification messages
    const statusMessages = {
      CONFIRMED: {
        title: 'Order Confirmed! 🎉',
        body: 'Restaurant confirmed your order!',
      },
      PREPARING: {
        title: 'Being Prepared 👨‍🍳',
        body: 'Chefs are working on your order',
      },
      RIDER_ASSIGNED: {
        title: 'Rider Assigned 🛵',
        body: `${riderName} is heading to pick up your order`,
      },
      PICKED_UP: {
        title: 'Order Picked Up! 🛵',
        body: 'Your food has been picked up! On the way',
      },
      ON_THE_WAY: {
        title: 'On the Way! 🚀',
        body: `${riderName} is heading to you!`,
      },
      DELIVERED: {
        title: 'Delivered! 🎉',
        body: 'Order delivered! Enjoy your meal',
      },
      CANCELLED: {
        title: 'Order Cancelled ❌',
        body: 'Your order has been cancelled',
      },
    };

    const message = statusMessages[newStatus];
    if (!message) return;

    try {
      const userDoc = await db.collection('users').doc(customerId).get();
      if (!userDoc.exists) return;
      const fcmToken = userDoc.data().fcmToken;

      if (fcmToken) {
        await messaging.send({
          token: fcmToken,
          notification: {
            title: message.title,
            body: message.body,
          },
          data: {
            type: 'order_update',
            orderId: context.params.orderId,
            status: newStatus,
          },
          android: {
            notification: {
              channelId: 'orders',
              priority: 'high',
              sound: 'default',
            },
          },
        });
      }

      // Create notification document
      await db
        .collection('notifications')
        .doc(customerId)
        .collection('items')
        .add({
          title: message.title,
          body: message.body,
          type: 'order',
          orderId: context.params.orderId,
          isRead: false,
          iconType: 'order',
          createdAt: Date.now(),
          deepLink: `foodapp://order/${context.params.orderId}`,
        });

      console.log(`Status update notification sent: ${newStatus}`);
    } catch (error) {
      console.error('Error sending status update notification:', error);
    }
  });

// ===================== HTTP CALLABLES =====================

/**
 * updateFCMToken — Saves FCM token for push notifications
 */
exports.updateFCMToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { userId, fcmToken } = data;
  if (!userId || !fcmToken) {
    throw new functions.https.HttpsError('invalid-argument', 'userId and fcmToken required');
  }

  await db.collection('users').doc(userId).update({
    fcmToken,
    updatedAt: Date.now(),
  });

  return { success: true };
});

/**
 * createOrder — Server-side order creation with validation
 */
exports.createOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { customerId, restaurantId, items, deliveryAddress, paymentMethodId } = data;

  // Validate required fields
  if (!customerId || !restaurantId || !items || !deliveryAddress) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    // Verify restaurant exists and is open
    const restaurantDoc = await db.collection('restaurants').doc(restaurantId).get();
    if (!restaurantDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Restaurant not found');
    }

    const restaurant = restaurantDoc.data();
    if (!restaurant.isOpen) {
      throw new functions.https.HttpsError('failed-precondition', 'Restaurant is currently closed');
    }

    // Calculate pricing server-side
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * item.quantity;
    }

    const deliveryFee = restaurant.deliveryFee || 30;
    const taxes = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryFee + taxes;

    // Validate minimum order
    if (subtotal < restaurant.minimumOrder) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Minimum order amount is ₹${restaurant.minimumOrder}`
      );
    }

    // Create order
    const orderRef = db.collection('orders').doc();
    const order = {
      orderId: orderRef.id,
      customerId,
      restaurantId,
      restaurantName: restaurant.name,
      restaurantImage: restaurant.headerImageUrl || '',
      status: 'PLACED',
      items,
      pricing: { subtotal, deliveryFee, taxes, discount: 0, total },
      deliveryAddress,
      paymentMethod: { type: 'upi', label: 'UPI' },
      paymentStatus: 'paid',
      estimatedDeliveryTime: restaurant.deliveryTimeMinutes || 30,
      statusTimeline: [{
        status: 'PLACED',
        timestamp: Date.now(),
        note: 'Order placed successfully',
      }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await orderRef.set(order);

    return {
      orderId: orderRef.id,
      estimatedTime: restaurant.deliveryTimeMinutes || 30,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error('Error creating order:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create order');
  }
});

/**
 * Helper: get driving distance from OSRM
 */
function getDrivingDistance(lat1, lng1, lat2, lng2) {
  return new Promise((resolve) => {
    const url = `http://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=false`;
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.code === 'Ok' && json.routes && json.routes.length > 0) {
            resolve(json.routes[0].distance / 1000); // km
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

/**
 * Helper: Haversine fallback
 */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/**
 * onRiderOnline — Triggered when a rider's isOnline status changes
 * If they go online, check for queued/unassigned orders and assign one.
 */
exports.onRiderOnline = functions.firestore
  .document('riders/{riderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if rider just went online and doesn't have an active order
    if (!before.isOnline && after.isOnline && !after.activeOrderId) {
      console.log(`Rider ${context.params.riderId} went online. Checking for queued orders...`);
      
      try {
        // Find the oldest unassigned order
        const pendingOrders = await db.collection('orders')
          .where('status', '==', 'PLACED')
          .where('riderId', '==', null)
          .orderBy('createdAt', 'asc')
          .limit(1)
          .get();

        if (!pendingOrders.empty) {
          const orderDoc = pendingOrders.docs[0];
          const orderId = orderDoc.id;
          const orderData = orderDoc.data();
          
          let pickupKm = await getDrivingDistance(
            after.riderLat, after.riderLng,
            orderData.restaurantLocation.latitude, orderData.restaurantLocation.longitude
          );
          
          let deliveryKm = await getDrivingDistance(
            orderData.restaurantLocation.latitude, orderData.restaurantLocation.longitude,
            orderData.deliveryAddress.latitude, orderData.deliveryAddress.longitude
          );

          if (pickupKm === null) pickupKm = haversineKm(after.riderLat, after.riderLng, orderData.restaurantLocation.latitude, orderData.restaurantLocation.longitude);
          if (deliveryKm === null) deliveryKm = haversineKm(orderData.restaurantLocation.latitude, orderData.restaurantLocation.longitude, orderData.deliveryAddress.latitude, orderData.deliveryAddress.longitude);

          const pickupAmount = pickupKm > 2 ? (pickupKm - 2) * 7 : 0;
          const deliveryAmount = deliveryKm * 15;
          const totalAmount = Math.round((pickupAmount + deliveryAmount) * 100) / 100;

          // Assign to this rider
          await orderDoc.ref.update({
            riderId: context.params.riderId,
            riderName: after.name || 'Your Rider',
            riderPhone: after.phone || '',
            status: 'RIDER_ASSIGNED',
            updatedAt: Date.now(),
            statusTimeline: admin.firestore.FieldValue.arrayUnion({
              status: 'RIDER_ASSIGNED',
              timestamp: Date.now(),
              note: `Driver ${after.name || 'Rider'} assigned from queue`
            }),
            pickupKm: Math.round(pickupKm * 100) / 100,
            deliveryKm: Math.round(deliveryKm * 100) / 100,
            pickupAmount: Math.round(pickupAmount * 100) / 100,
            deliveryAmount: Math.round(deliveryAmount * 100) / 100,
            driverPayout: totalAmount,
          });

          // Update rider active order
          await change.after.ref.update({
            activeOrderId: orderId,
            updatedAt: Date.now(),
          });

          console.log(`Assigned queued order ${orderId} to newly online rider ${context.params.riderId}`);
        }
      } catch (error) {
        console.error('Error processing queued orders:', error);
      }
    }
  });
