// Firebase Order Service — with proper pricing, immediate assignment
import firestore, { firebase } from '@react-native-firebase/firestore';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import type {
  Order,
  OrderItem,
  OrderDeliveryAddress,
  OrderPaymentMethod,
  RiderLiveLocation,
} from '../../types';
import { getDrivingRoute } from '../utils/osrm';

// Haversine distance formula (km)
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Generate 4-digit delivery PIN
function generateDeliveryPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

class OrderService {
  // Helper to strip undefined values (Firestore rejects them)
  private cleanObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.cleanObject(item));
    }
    if (obj !== null && typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.cleanObject(value);
        }
      }
      return cleaned;
    }
    return obj;
  }

  // Calculate driver payout based on actual driving distances (OSRM)
  private async calculateDriverPayout(
    driverLat: number,
    driverLng: number,
    pickupLat: number,
    pickupLng: number,
    dropLat: number,
    dropLng: number,
  ) {
    console.log('[PAYOUT] Calculating payout...');
    console.log(`[PAYOUT] Driver: ${driverLat}, ${driverLng}`);
    console.log(`[PAYOUT] Pickup: ${pickupLat}, ${pickupLng}`);
    console.log(`[PAYOUT] Drop: ${dropLat}, ${dropLng}`);

    // Fallback to Haversine if OSRM fails
    let pickupKm = haversineKm(driverLat, driverLng, pickupLat, pickupLng);
    let deliveryKm = haversineKm(pickupLat, pickupLng, dropLat, dropLng);
    console.log(`[PAYOUT] Haversine fallback: pickupKm=${pickupKm}, deliveryKm=${deliveryKm}`);

    try {
      console.log('[PAYOUT] Trying OSRM routes...');
      const pickupRoute = await getDrivingRoute(driverLat, driverLng, pickupLat, pickupLng);
      const deliveryRoute = await getDrivingRoute(pickupLat, pickupLng, dropLat, dropLng);

      if (pickupRoute) {
        pickupKm = pickupRoute.distance / 1000;
        console.log(`[PAYOUT] OSRM pickupKm: ${pickupKm}`);
      }
      if (deliveryRoute) {
        deliveryKm = deliveryRoute.distance / 1000;
        console.log(`[PAYOUT] OSRM deliveryKm: ${deliveryKm}`);
      }
    } catch (e) {
      console.log('[PAYOUT] OSRM failed, using Haversine fallback:', e);
    }

    // Pickup: free for first 2km, then ₹7/km
    const pickupAmount = pickupKm > 2 ? (pickupKm - 2) * 7 : 0;
    // Delivery: ₹15/km
    const deliveryAmount = deliveryKm * 15;
    const totalAmount = Math.round((pickupAmount + deliveryAmount) * 100) / 100;

    console.log(`[PAYOUT] Final: pickupKm=${pickupKm}, deliveryKm=${deliveryKm}, payout=${totalAmount}`);
    return {
      pickupKm: Math.round(pickupKm * 100) / 100,
      deliveryKm: Math.round(deliveryKm * 100) / 100,
      pickupAmount: Math.round(pickupAmount * 100) / 100,
      deliveryAmount: Math.round(deliveryAmount * 100) / 100,
      driverPayout: totalAmount,
    };
  }

  // Find available driver (online + no active order)
  private async findAvailableDriver(): Promise<{
    riderId: string;
    riderName: string;
    riderPhone: string;
    riderLat: number;
    riderLng: number;
  } | null> {
    try {
      console.log('[FIND_DRIVER] Searching for online riders...');
      // Get all online riders
      const driversSnapshot = await firestore()
        .collection('riders')
        .where('isOnline', '==', true)
        .get();

      console.log(`[FIND_DRIVER] Found ${driversSnapshot.size} online riders`);

      if (driversSnapshot.empty) {
        console.log('[FIND_DRIVER] No online riders found!');
        return null;
      }

      // Find one without an active order
      for (const driverDoc of driversSnapshot.docs) {
        const driverData = driverDoc.data();
        console.log(`[FIND_DRIVER] Checking rider: ${driverDoc.id}, activeOrderId: ${driverData.activeOrderId}, name: ${driverData.name}`);

        // Skip drivers with active orders
        if (driverData.activeOrderId) {
          console.log(`[FIND_DRIVER] Skipping ${driverDoc.id} — has active order`);
          continue;
        }

        // Use Firestore coords directly (Driver App syncs GPS here every 15s)
        // NOTE: We skip RTDB read because Customer App lacks RTDB permissions
        const finalLat = driverData.currentLat || 0;
        const finalLng = driverData.currentLng || 0;
        console.log(`[FIND_DRIVER] Firestore coords: ${finalLat}, ${finalLng}`);

        return {
          riderId: driverDoc.id,
          riderName: driverData.name || 'Your Rider',
          riderPhone: driverData.phone || '',
          riderLat: finalLat,
          riderLng: finalLng,
        };
      }
      console.log('[FIND_DRIVER] All online riders have active orders');
      return null;
    } catch (err) {
      console.log('[FIND_DRIVER] ERROR:', err);
      return null;
    }
  }

  // Create a new order
  async createOrder(orderData: {
    customerId: string;
    restaurantId: string;
    restaurantName: string;
    restaurantImage: string;
    items: OrderItem[];
    pricing: Order['pricing'];
    deliveryAddress: OrderDeliveryAddress;
    paymentMethod: OrderPaymentMethod;
    estimatedDeliveryTime: number;
  }): Promise<string> {
    try {
      const orderRef = firestore().collection('orders').doc();
      const orderId = orderRef.id;

      // Get customer's full name from auth profile
      const currentUser = auth().currentUser;
      const customerName = currentUser?.displayName || 'Customer';

      // Generate delivery PIN
      const deliveryPin = generateDeliveryPin();

      // Fetch restaurant coordinates
      let restaurantLat = 0;
      let restaurantLng = 0;
      let restaurantAddress = '';
      try {
        const restaurantDoc = await firestore()
          .collection('restaurants')
          .doc(orderData.restaurantId)
          .get();
        if (restaurantDoc.exists) {
          const rData = restaurantDoc.data();
          restaurantLat = rData?.address?.lat || rData?.latitude || 0;
          restaurantLng = rData?.address?.lng || rData?.longitude || 0;
          restaurantAddress = rData?.address?.fullAddress || rData?.name || '';
        }
      } catch (err) {
        console.log('Error fetching restaurant coords:', err);
      }

      // Create the order initially as PLACED (no driver yet)
      const order = {
        orderId,
        customerId: orderData.customerId,
        customerName,
        restaurantId: orderData.restaurantId,
        restaurantName: orderData.restaurantName,
        restaurantImage: orderData.restaurantImage || '',
        restaurantAddress,
        restaurantLat,
        restaurantLng,
        status: 'PLACED',
        riderId: null,
        riderName: null,
        riderPhone: null,
        deliveryPin,
        items: orderData.items,
        pricing: orderData.pricing,
        deliveryAddress: orderData.deliveryAddress,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: 'pending',
        estimatedDeliveryTime: orderData.estimatedDeliveryTime,
        // Driver payout fields (will be calculated when driver is assigned)
        pickupKm: 0,
        deliveryKm: 0,
        pickupAmount: 0,
        deliveryAmount: 0,
        driverPayout: 0,
        orderNotReady: false,
        statusTimeline: [
          {
            status: 'PLACED',
            timestamp: Date.now(),
            note: 'Order placed successfully',
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Save order to Firestore
      await orderRef.set(this.cleanObject(order));
      console.log('[ORDER] Order created:', orderId);

      // Assign driver asynchronously (background process)
      // We don't await this so the UI can proceed to 'Order Placed' instantly.
      console.log('[ORDER] Starting async driver assignment...');
      this.assignDriverNow(
        orderId, 
        restaurantLat, 
        restaurantLng,
        orderData.deliveryAddress.lat, 
        orderData.deliveryAddress.lng
      ).catch(assignErr => {
        console.log('[ORDER] Background assignment error:', assignErr);
      });

      return orderId;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order. Please try again.');
    }
  }

  // Assign driver asynchronously — finds a driver, proposes order, waits for response
  private async assignDriverNow(
    orderId: string,
    restaurantLat: number,
    restaurantLng: number,
    dropLat: number,
    dropLng: number,
  ) {
    console.log(`[ASSIGN] Starting assignment for order ${orderId}`);
    
    // Prevent 0,0 OSRM route calculations that result in 16000km distances
    let pickupLat = restaurantLat;
    let pickupLng = restaurantLng;
    if (pickupLat === 0 && pickupLng === 0) {
      console.log('[ASSIGN] ⚠️ WARNING: Restaurant coordinates are 0,0. Falling back to defaults.');
      pickupLat = dropLat; // fallback to avoid massive OSRM requests
      pickupLng = dropLng;
    }

    // Pre-calculate full route to save to order
    console.log('[ASSIGN] Pre-calculating OSRM full delivery route...');
    const { getDrivingRoute } = require('../utils/osrm');
    let fullRouteCoords: any[] = [];
    try {
      const route = await getDrivingRoute(pickupLat, pickupLng, dropLat, dropLng);
      if (route && route.coordinates) {
        fullRouteCoords = route.coordinates;
        // Save the route coordinates to the order document so Driver App can draw it
        await firestore().collection('orders').doc(orderId).update({
          routeCoordinates: fullRouteCoords
        });
      }
    } catch (e) {
      console.log('[ASSIGN] Failed to fetch OSRM route:', e);
    }

    // Try to find a driver (up to 12 attempts)
    for (let attempt = 1; attempt <= 12; attempt++) {
      console.log(`[ASSIGN] Attempt ${attempt}/12`);

      // Check if order was cancelled by customer
      try {
        const orderDoc = await firestore().collection('orders').doc(orderId).get();
        if (orderDoc.exists && orderDoc.data()?.status === 'CANCELLED') {
          console.log('[ASSIGN] Order was cancelled, stopping background loop');
          return;
        }
        // If order already has a rider assigned, stop loop
        if (orderDoc.exists && orderDoc.data()?.riderId) {
          console.log('[ASSIGN] Order already assigned, stopping background loop');
          return;
        }
      } catch (e) {
        console.log('[ASSIGN] Status check error:', e);
      }

      const driver = await this.findAvailableDriver();

      if (driver) {
        console.log(`[ASSIGN] Found driver: ${driver.riderId} (${driver.riderName})`);

        // Calculate payout
        console.log('[ASSIGN] Calculating payout...');
        const payout = await this.calculateDriverPayout(
          driver.riderLat, driver.riderLng,
          pickupLat, pickupLng,
          dropLat, dropLng,
        );
        
        // Update order with driver payout details BEFORE assigning
        await firestore().collection('orders').doc(orderId).update({
          driverPayout: payout.driverPayout,
          pickupKm: payout.pickupKm,
          deliveryKm: payout.deliveryKm,
          pickupAmount: payout.pickupAmount,
          deliveryAmount: payout.deliveryAmount,
          'pricing.deliveryFee': payout.driverPayout, // optional
        });

        // Propose order to driver by setting their activeOrderId
        console.log(`[ASSIGN] Proposing order to driver ${driver.riderId}`);
        await firestore().collection('riders').doc(driver.riderId).update({
          activeOrderId: orderId,
          updatedAt: Date.now(),
        });
        try {
          await database().ref(`liveLocations/${driver.riderId}`).update({
            activeOrderId: orderId,
          });
        } catch (_) {}

        // Wait EXACTLY 15 seconds for driver to accept
        console.log('[ASSIGN] Waiting 15s for driver response...');
        await new Promise(resolve => setTimeout(resolve, 15000));

        // After 15 seconds, check if the driver actually accepted the order
        const checkOrder = await firestore().collection('orders').doc(orderId).get();
        if (checkOrder.exists && checkOrder.data()?.riderId === driver.riderId) {
          console.log(`[ASSIGN] ✅ SUCCESS: Driver ${driver.riderId} accepted!`);
          return; // Driver accepted, we are done
        } else if (checkOrder.exists && checkOrder.data()?.status === 'CANCELLED') {
          console.log('[ASSIGN] Order cancelled during wait');
          return;
        } else {
          // Driver ignored it or declined it. The Driver App might have cleared their activeOrderId.
          // Just to be safe, if we are looping, we should ensure the order is NOT assigned.
          console.log('[ASSIGN] Driver ignored or declined. Removing proposal...');
          
          // Clear proposal from this driver if they haven't manually declined it yet
          const checkDriver = await firestore().collection('riders').doc(driver.riderId).get();
          if (checkDriver.exists && checkDriver.data()?.activeOrderId === orderId) {
             await firestore().collection('riders').doc(driver.riderId).update({
               activeOrderId: null,
               updatedAt: Date.now(),
             });
             try {
                await database().ref(`liveLocations/${driver.riderId}`).update({
                  activeOrderId: null,
                });
             } catch (_) {}
          }
        }
      } else {
        // No driver found — wait 5 seconds before retrying
        console.log(`[ASSIGN] No driver found, waiting 5s (attempt ${attempt}/12)...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log('[ASSIGN] ❌ Could not find a driver after 12 attempts');
  }

  // Get order by ID
  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const doc = await firestore().collection('orders').doc(orderId).get();
      if (doc.exists) {
        return doc.data() as Order;
      }
      return null;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  }

  // Get orders for a customer
  async getCustomerOrders(customerId: string): Promise<Order[]> {
    try {
      const snapshot = await firestore()
        .collection('orders')
        .where('customerId', '==', customerId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map((doc) => doc.data() as Order);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      return [];
    }
  }

  // Listen to order status changes (real-time)
  onOrderSnapshot(
    orderId: string,
    callback: (order: Order | null) => void,
  ): () => void {
    return firestore()
      .collection('orders')
      .doc(orderId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          callback(doc.data() as Order);
        } else {
          callback(null);
        }
      });
  }

  // Listen to rider live location (real-time)
  onRiderLocationUpdate(
    riderId: string,
    callback: (location: RiderLiveLocation | null) => void,
  ): () => void {
    const ref = database().ref(`liveLocations/${riderId}`);
    const handler = ref.on('value', (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as RiderLiveLocation);
      } else {
        callback(null);
      }
    });

    return () => ref.off('value', handler);
  }

  // Submit order rating
  async submitRating(
    orderId: string,
    data: {
      restaurantRating?: number;
      riderRating?: number;
      reviewText?: string;
    },
  ): Promise<void> {
    try {
      await firestore()
        .collection('orders')
        .doc(orderId)
        .update({
          ...data,
          updatedAt: Date.now(),
        });
    } catch (error) {
      console.error('Error submitting rating:', error);
      throw new Error('Failed to submit rating.');
    }
  }

  // Cancel order
  async cancelOrder(orderId: string): Promise<void> {
    try {
      const orderDoc = await firestore().collection('orders').doc(orderId).get();
      const currentTimeline = orderDoc.data()?.statusTimeline || [];
      const newTimeline = [...currentTimeline, {
        status: 'CANCELLED',
        timestamp: Date.now(),
        note: 'Order cancelled by customer',
      }];

      await firestore().collection('orders').doc(orderId).update({
        status: 'CANCELLED',
        updatedAt: Date.now(),
        statusTimeline: newTimeline,
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw new Error('Failed to cancel order.');
    }
  }
}

export const orderService = new OrderService();
