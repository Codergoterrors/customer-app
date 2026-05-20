// Firebase Restaurant Service
import firestore from '@react-native-firebase/firestore';
import type { Restaurant, MenuItem, Promo, PromoBanner } from '../../types';

class RestaurantService {
  // Fetch all restaurants
  async getRestaurants(): Promise<Restaurant[]> {
    try {
      const snapshot = await firestore()
        .collection('restaurants')
        .orderBy('rating', 'desc')
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Restaurant[];
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      return [];
    }
  }

  // Fetch restaurants by cuisine/category
  async getRestaurantsByCategory(category: string): Promise<Restaurant[]> {
    try {
      const snapshot = await firestore()
        .collection('restaurants')
        .where('cuisineType', 'array-contains', category)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Restaurant[];
    } catch (error) {
      console.error('Error fetching restaurants by category:', error);
      return [];
    }
  }

  // Fetch single restaurant
  async getRestaurant(restaurantId: string): Promise<Restaurant | null> {
    try {
      const doc = await firestore()
        .collection('restaurants')
        .doc(restaurantId)
        .get();

      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as Restaurant;
      }
      return null;
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      return null;
    }
  }

  // Fetch restaurant menu
  async getMenu(restaurantId: string): Promise<MenuItem[]> {
    try {
      const snapshot = await firestore()
        .collection('restaurants')
        .doc(restaurantId)
        .collection('menu')
        .get();

      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        restaurantId,
        ...doc.data(),
      })) as MenuItem[];

      // Sort client-side to avoid needing a composite Firestore index
      return items.sort((a, b) => {
        if (a.categoryOrder !== b.categoryOrder) return a.categoryOrder - b.categoryOrder;
        return a.itemOrder - b.itemOrder;
      });
    } catch (error) {
      console.error('Error fetching menu:', error);
      return [];
    }
  }

  // Search restaurants
  async searchRestaurants(query: string): Promise<Restaurant[]> {
    try {
      const normalizedQuery = query.toLowerCase();
      const snapshot = await firestore().collection('restaurants').get();

      return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Restaurant))
        .filter(
          (r) =>
            r.name.toLowerCase().includes(normalizedQuery) ||
            r.cuisineType.some((c) =>
              c.toLowerCase().includes(normalizedQuery),
            ) ||
            r.tags.some((t) => t.toLowerCase().includes(normalizedQuery)),
        );
    } catch (error) {
      console.error('Error searching restaurants:', error);
      return [];
    }
  }

  // Fetch promo banners
  async getPromoBanners(): Promise<PromoBanner[]> {
    try {
      const snapshot = await firestore()
        .collection('promoBanners')
        .where('isActive', '==', true)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PromoBanner[];
    } catch (error) {
      console.error('Error fetching promo banners:', error);
      return [];
    }
  }

  // Validate promo code
  async validatePromoCode(
    code: string,
    orderTotal: number,
  ): Promise<{ valid: boolean; discount: number; message: string }> {
    try {
      const doc = await firestore().collection('promos').doc(code).get();

      if (!doc.exists) {
        return { valid: false, discount: 0, message: 'Invalid promo code' };
      }

      const promo = doc.data() as Promo;
      const now = Date.now();

      if (!promo.isActive) {
        return {
          valid: false,
          discount: 0,
          message: 'This promo code has expired',
        };
      }
      if (now < promo.validFrom || now > promo.validUntil) {
        return {
          valid: false,
          discount: 0,
          message: 'This promo code is not valid at this time',
        };
      }
      if (promo.usedCount >= promo.usageLimit) {
        return {
          valid: false,
          discount: 0,
          message: 'This promo code has reached its usage limit',
        };
      }
      if (orderTotal < promo.minimumOrder) {
        return {
          valid: false,
          discount: 0,
          message: `Minimum order of ₹${promo.minimumOrder} required`,
        };
      }

      let discount = 0;
      if (promo.discountType === 'percentage') {
        discount = (orderTotal * promo.discountValue) / 100;
        discount = Math.min(discount, promo.maximumDiscount);
      } else {
        discount = promo.discountValue;
      }

      return {
        valid: true,
        discount,
        message: `₹${discount} discount applied!`,
      };
    } catch (error) {
      console.error('Error validating promo:', error);
      return {
        valid: false,
        discount: 0,
        message: 'Error validating promo code',
      };
    }
  }

  // Listen to restaurant updates (real-time)
  onRestaurantsSnapshot(
    callback: (restaurants: Restaurant[]) => void,
  ): () => void {
    return firestore()
      .collection('restaurants')
      .orderBy('rating', 'desc')
      .onSnapshot((snapshot) => {
        const restaurants = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Restaurant),
        );
        callback(restaurants);
      });
  }
}

export const restaurantService = new RestaurantService();
