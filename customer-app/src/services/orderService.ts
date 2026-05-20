// Firebase Order Service — with proper pricing, 15-sec delay, offline driver handling
import firestore from '@react-native-firebase/firestore';
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
    // Fallback to Haversine if OSRM fails
    let pickupKm = haversineKm(driverLat, driverLng, pickupLat, pickupLng);
    let deliveryKm = haversineKm(pickupLat, pickupLng, dropLat, dropLng);

    try {
      const pickupRoute = await getDrivingRoute(driverLat, driverLng, pickupLat, pickupLng);
      const deliveryRoute = await getDrivingRoute(pickupLat, pickupLng, dropLat, dropLng);

      if (pickupRoute) pickupKm = pickupRoute.distance / 1000;
      if (deliveryRoute) deliveryKm = deliveryRoute.distance / 1000;
    } catch (e) {
      console.log('Using Haversine fallback for distance calculation');
    }

    // Pickup: free for first 2km, then ₹7/km
    const pickupAmount = pickupKm > 2 ? (pickupKm - 2) * 7 : 0;
    // Delivery: ₹15/km
    const deliveryAmount = deliveryKm * 15;
    const totalAmount = Math.round((pickupAmount + deliveryAmount) * 100) / 100;

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
      // Get all online riders
      const driversSnapshot = await firestore()
        .collection('riders')
        .where('isOnline', '==', true)
        .get();

      if (driversSnapshot.empty) return null;

      // Find one without an active order
      for (const driverDoc of driversSnapshot.docs) {
        const driverData = driverDoc.data();
        // Skip drivers with active orders
        if (driverData.activeOrderId) continue;

        // Get driver's live location from RTDB
        let riderLat = 0;
        let riderLng = 0;
        try {
          const locSnapshot = await database()
            .ref(`liveLocations/${driverDoc.id}`)
            .once('value');
          if (locSnapshot.exists()) {
            const locData = locSnapshot.val();
            riderLat = locData.lat || 0;
            riderLng = locData.lng || 0;
          }
        } catch (e) {
          console.log('Error fetching driver location', e);
        }

        return {
          riderId: driverDoc.id,
          riderName: driverData.name || 'Your Rider',
          riderPhone: driverData.phone || '',
          riderLat,
          riderLng,
        };
      }
      return null;
    } catch (err) {
      console.log('Error finding available driver', err);
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
      console.log('Order created:', orderId);

      // Start background assignment process (15-second delay)
      this.assignDriverWithDelay(orderId, restaurantLat, restaurantLng,
        orderData.deliveryAddress.lat, orderData.deliveryAddress.lng);

      return orderId;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order. Please try again.');
    }
  }

  // Background: wait 15 seconds, find driver, calculate pricing, assign
  private async assignDriverWithDelay(
    orderId: string,
    restaurantLat: number,
    restaurantLng: number,
    dropLat: number,
    dropLng: number,
  ) {
    // Wait 15 seconds minimum
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Try to find and assign a driver (retry up to 60 times = 5 minutes)
    let attempts = 0;
    const maxAttempts = 60;

    const tryAssign = async () => {
      attempts++;
      const driver = await this.findAvailableDriver();

      if (driver) {
        // Calculate distances and payout perfectly with OSRM
        const payout = await this.calculateDriverPayout(
          driver.riderLat, driver.riderLng,
          restaurantLat, restaurantLng,
          dropLat, dropLng,
        );

        // Update order with driver info and pricing
        try {
          await firestore().collection('orders').doc(orderId).update({
            riderId: driver.riderId,
            riderName: driver.riderName,
            riderPhone: driver.riderPhone,
            status: 'RIDER_ASSIGNED',
            pickupKm: payout.pickupKm,
            deliveryKm: payout.deliveryKm,
            pickupAmount: payout.pickupAmount,
            deliveryAmount: payout.deliveryAmount,
            driverPayout: payout.driverPayout,
            'pricing.deliveryFee': payout.driverPayout,
            updatedAt: Date.now(),
            statusTimeline: firestore.FieldValue.arrayUnion({
              status: 'RIDER_ASSIGNED',
              timestamp: Date.now(),
              note: `Driver ${driver.riderName} assigned`,
            }),
          });

          // Mark driver as having active order
          await firestore().collection('riders').doc(driver.riderId).update({
            activeOrderId: orderId,
            updatedAt: Date.now(),
          });

          // Update RTDB
          await database().ref(`liveLocations/${driver.riderId}`).update({
            activeOrderId: orderId,
          });

          console.log(`Driver ${driver.riderId} assigned to order ${orderId}`);
        } catch (err) {
          console.error('Error assigning driver:', err);
        }
      } else if (attempts < maxAttempts) {
        // No driver available, retry in 5 seconds
        console.log(`No available driver (attempt ${attempts}/${maxAttempts}), retrying in 5s...`);
        setTimeout(tryAssign, 5000);
      } else {
        console.log('Max attempts reached, order remains unassigned');
      }
    };

    tryAssign();
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
      await firestore().collection('orders').doc(orderId).update({
        status: 'CANCELLED',
        updatedAt: Date.now(),
        statusTimeline: firestore.FieldValue.arrayUnion({
          status: 'CANCELLED',
          timestamp: Date.now(),
          note: 'Order cancelled by customer',
        }),
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw new Error('Failed to cancel order.');
    }
  }
}

export const orderService = new OrderService();
