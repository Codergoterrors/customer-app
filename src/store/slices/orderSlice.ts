// Order Redux Slice
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Order, RiderLiveLocation } from '../../types';

interface OrderState {
  activeOrder: Order | null;
  pastOrders: Order[];
  isLoading: boolean;
  error: string | null;
  riderLocation: RiderLiveLocation | null;
}

const initialState: OrderState = {
  activeOrder: null,
  pastOrders: [],
  isLoading: false,
  error: null,
  riderLocation: null,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setActiveOrder(state, action: PayloadAction<Order | null>) {
      state.activeOrder = action.payload;
    },
    setPastOrders(state, action: PayloadAction<Order[]>) {
      state.pastOrders = action.payload;
      state.isLoading = false;
    },
    addPastOrder(state, action: PayloadAction<Order>) {
      state.pastOrders = [action.payload, ...state.pastOrders];
    },
    updateOrderStatus(
      state,
      action: PayloadAction<{
        orderId: string;
        status: Order['status'];
        timeline?: Order['statusTimeline'][0];
      }>,
    ) {
      const { orderId, status, timeline } = action.payload;
      if (state.activeOrder?.orderId === orderId) {
        state.activeOrder.status = status;
        if (timeline) {
          state.activeOrder.statusTimeline.push(timeline);
        }
      }
    },
    setRiderLocation(state, action: PayloadAction<RiderLiveLocation | null>) {
      state.riderLocation = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    updateOrderRating(
      state,
      action: PayloadAction<{
        orderId: string;
        restaurantRating?: number;
        riderRating?: number;
        reviewText?: string;
      }>,
    ) {
      const { orderId, restaurantRating, riderRating, reviewText } =
        action.payload;
      if (state.activeOrder?.orderId === orderId) {
        if (restaurantRating !== undefined)
          state.activeOrder.restaurantRating = restaurantRating;
        if (riderRating !== undefined)
          state.activeOrder.riderRatingValue = riderRating;
        if (reviewText !== undefined)
          state.activeOrder.reviewText = reviewText;
      }
      const pastOrder = state.pastOrders.find((o) => o.orderId === orderId);
      if (pastOrder) {
        if (restaurantRating !== undefined)
          pastOrder.restaurantRating = restaurantRating;
        if (riderRating !== undefined)
          pastOrder.riderRatingValue = riderRating;
        if (reviewText !== undefined) pastOrder.reviewText = reviewText;
      }
    },
    clearActiveOrder(state) {
      // Move current active order to pastOrders before clearing
      if (state.activeOrder) {
        const exists = state.pastOrders.find(o => o.orderId === state.activeOrder!.orderId);
        if (!exists) {
          state.pastOrders = [state.activeOrder, ...state.pastOrders];
        }
      }
      state.activeOrder = null;
      state.riderLocation = null;
    },
  },
});

export const {
  setActiveOrder,
  setPastOrders,
  addPastOrder,
  updateOrderStatus,
  setRiderLocation,
  setLoading,
  setError,
  updateOrderRating,
  clearActiveOrder,
} = orderSlice.actions;

export default orderSlice.reducer;
