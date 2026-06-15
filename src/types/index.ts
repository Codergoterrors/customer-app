// FoodApp Customer — TypeScript Type Definitions

// ==================== USER ====================
export interface SavedAddress {
  id: string;
  label: string;
  fullAddress: string;
  lat: number;
  lng: number;
  flatNo?: string;
  buildingName?: string;
  area?: string;
  landmark?: string;
  isDefault: boolean;
}

export interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'wallet';
  label: string;
  isDefault: boolean;
  lastFour?: string;
  expiryDate?: string;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  phone: string;
  profilePhotoUrl?: string;
  fcmToken?: string;
  savedAddresses: SavedAddress[];
  savedPaymentMethods: SavedPaymentMethod[];
  createdAt: number;
  updatedAt: number;
}

// ==================== RESTAURANT ====================
export interface OpeningHours {
  open: string;
  close: string;
}

export interface RestaurantAddress {
  fullAddress: string;
  lat: number;
  lng: number;
  city: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisineType: string[];
  headerImageUrl: string;
  logoUrl: string;
  rating: number;
  totalReviews: number;
  deliveryTimeMinutes: number;
  deliveryFee: number;
  minimumOrder: number;
  isOpen: boolean;
  openingHours: Record<string, OpeningHours>;
  address: RestaurantAddress;
  phone: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

// ==================== MENU ====================
export interface CustomizationOption {
  id: string;
  name: string;
  extraPrice: number;
}

export interface CustomizationGroup {
  id: string;
  title: string;
  type: 'single' | 'multiple';
  required: boolean;
  options: CustomizationOption[];
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  categoryOrder: number;
  itemOrder: number;
  isAvailable: boolean;
  isVeg: boolean;
  isPopular: boolean;
  isSpicy: boolean;
  preparationTimeMinutes: number;
  customizationGroups: CustomizationGroup[];
}

// ==================== CART ====================
export interface SelectedCustomization {
  groupId: string;
  groupTitle: string;
  optionId: string;
  optionName: string;
  extraPrice: number;
}

export interface CartItem {
  id: string; // unique cart item id
  itemId: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  customizations: SelectedCustomization[];
  specialInstructions?: string;
  totalPrice: number; // (price + customization extras) * quantity
}

// ==================== ORDER ====================
export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'RIDER_ASSIGNED'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  customizations: SelectedCustomization[];
  specialInstructions?: string;
}

export interface OrderPricing {
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  discount: number;
  total: number;
}

export interface OrderDeliveryAddress {
  fullAddress: string;
  lat: number;
  lng: number;
  flatNo?: string;
  landmark?: string;
}

export interface OrderPaymentMethod {
  type: 'card' | 'upi' | 'wallet';
  label: string;
}

export interface StatusTimelineEntry {
  status: OrderStatus;
  timestamp: number;
  note?: string;
}

export interface Order {
  orderId: string;
  customerId: string;
  customerName?: string;
  restaurantId: string;
  restaurantName: string;
  restaurantImage: string;
  restaurantAddress?: string;
  restaurantLat?: number;
  restaurantLng?: number;
  restaurantNote?: string;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  riderRating?: number;
  riderVehicle?: string;
  riderPlateNumber?: string;
  riderPhotoUrl?: string;
  // Live rider coordinates embedded in order doc (written by driver app every 10s)
  // Used by customer app as a guaranteed tracking fallback — no extra Firebase rules needed
  riderCurrentLat?: number;
  riderCurrentLng?: number;
  riderHeading?: number;
  status: OrderStatus;
  items: OrderItem[];
  pricing: OrderPricing;
  deliveryAddress: OrderDeliveryAddress;
  paymentMethod: OrderPaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  estimatedDeliveryTime: number;
  actualDeliveryTime?: number;
  statusTimeline: StatusTimelineEntry[];
  deliveryPin?: string;
  orderNotReady?: boolean;
  cancelledBy?: 'customer' | 'rider' | 'restaurant';
  cancelReason?: string;
  driverPayout?: number;
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  restaurantRating?: number;
  riderRatingValue?: number;
  reviewText?: string;
  createdAt: number;
  updatedAt: number;
}

// ==================== NOTIFICATION ====================
export type NotificationType = 'order' | 'promo' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  orderId?: string;
  isRead: boolean;
  iconType: string;
  createdAt: number;
  deepLink?: string;
}

// ==================== PROMO ====================
export interface Promo {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minimumOrder: number;
  maximumDiscount: number;
  validFrom: number;
  validUntil: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

// ==================== LIVE LOCATION ====================
export interface RiderLiveLocation {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  updatedAt: number;
  isOnline: boolean;
  activeOrderId?: string;
}

// ==================== NAVIGATION ====================
export type AuthStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  OTP: { phoneNumber: string };
  LocationSetup: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Search: undefined;
  Restaurant: { restaurantId: string };
  Cart: undefined;
  Checkout: undefined;
  OrderPlaced: { orderId: string };
  OrderTracking: { orderId: string };
  DeliveryConfirmed: { orderId: string };
  AddAddress: { returnTo?: string } | undefined;
  SelectAddress: undefined;
  Help: { orderId: string; canCancel: boolean };
  CancelOrder: { orderId: string };
  OrderCancelled: { orderId: string; cancelledBy: 'customer' | 'rider' | 'restaurant'; cancelReason?: string };
};

export type OrdersStackParamList = {
  Orders: undefined;
  OrderDetail: { orderId: string };
  OrderTracking: { orderId: string };
};

export type AccountStackParamList = {
  Profile: undefined;
  Addresses: undefined;
  PaymentMethods: undefined;
  Notifications: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  OrdersTab: undefined;
  AccountTab: undefined;
};

// ==================== CATEGORY ====================
export interface FoodCategory {
  id: string;
  name: string;
  emoji: string;
}

// ==================== PROMO BANNER ====================
export interface PromoBanner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  promoCode?: string;
}
