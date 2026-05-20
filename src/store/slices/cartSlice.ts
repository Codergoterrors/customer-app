// Cart Redux Slice
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CartItem, SelectedCustomization } from '../../types';

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  promoCode: string | null;
  promoDiscount: number;
  deliveryInstructions: string;
}

const initialState: CartState = {
  items: [],
  restaurantId: null,
  restaurantName: null,
  promoCode: null,
  promoDiscount: 0,
  deliveryInstructions: '',
};

const generateCartItemId = (): string => {
  return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const calculateItemTotal = (
  price: number,
  customizations: SelectedCustomization[],
  quantity: number,
): number => {
  const customizationTotal = customizations.reduce(
    (sum, c) => sum + c.extraPrice,
    0,
  );
  return (price + customizationTotal) * quantity;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(
      state,
      action: PayloadAction<Omit<CartItem, 'id' | 'totalPrice'>>,
    ) {
      const newItem = action.payload;

      // If adding from different restaurant, clear cart first
      if (state.restaurantId && state.restaurantId !== newItem.restaurantId) {
        state.items = [];
        state.promoCode = null;
        state.promoDiscount = 0;
      }

      state.restaurantId = newItem.restaurantId;
      state.restaurantName = newItem.restaurantName;

      const cartItem: CartItem = {
        ...newItem,
        id: generateCartItemId(),
        totalPrice: calculateItemTotal(
          newItem.price,
          newItem.customizations,
          newItem.quantity,
        ),
      };

      state.items.push(cartItem);
    },

    updateItemQuantity(
      state,
      action: PayloadAction<{ cartItemId: string; quantity: number }>,
    ) {
      const { cartItemId, quantity } = action.payload;
      const item = state.items.find((i) => i.id === cartItemId);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((i) => i.id !== cartItemId);
        } else {
          item.quantity = quantity;
          item.totalPrice = calculateItemTotal(
            item.price,
            item.customizations,
            quantity,
          );
        }
      }

      // Clear restaurant info if cart is empty
      if (state.items.length === 0) {
        state.restaurantId = null;
        state.restaurantName = null;
        state.promoCode = null;
        state.promoDiscount = 0;
      }
    },

    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
      if (state.items.length === 0) {
        state.restaurantId = null;
        state.restaurantName = null;
        state.promoCode = null;
        state.promoDiscount = 0;
      }
    },

    clearCart(state) {
      state.items = [];
      state.restaurantId = null;
      state.restaurantName = null;
      state.promoCode = null;
      state.promoDiscount = 0;
      state.deliveryInstructions = '';
    },

    applyPromo(
      state,
      action: PayloadAction<{ code: string; discount: number }>,
    ) {
      state.promoCode = action.payload.code;
      state.promoDiscount = action.payload.discount;
    },

    removePromo(state) {
      state.promoCode = null;
      state.promoDiscount = 0;
    },

    setDeliveryInstructions(state, action: PayloadAction<string>) {
      state.deliveryInstructions = action.payload;
    },
  },
});

// Selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartItemCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
export const selectCartSubtotal = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
export const selectCartRestaurantId = (state: { cart: CartState }) =>
  state.cart.restaurantId;

export const {
  addToCart,
  updateItemQuantity,
  removeFromCart,
  clearCart,
  applyPromo,
  removePromo,
  setDeliveryInstructions,
} = cartSlice.actions;

export default cartSlice.reducer;
