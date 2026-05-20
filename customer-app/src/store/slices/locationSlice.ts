// Location Redux Slice
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SavedAddress } from '../../types';

interface LocationState {
  currentAddress: SavedAddress | null;
  currentLat: number | null;
  currentLng: number | null;
  isLocationPermissionGranted: boolean;
}

const initialState: LocationState = {
  currentAddress: null,
  currentLat: null,
  currentLng: null,
  isLocationPermissionGranted: false,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setCurrentAddress(state, action: PayloadAction<SavedAddress | null>) {
      state.currentAddress = action.payload;
    },
    setCurrentCoordinates(
      state,
      action: PayloadAction<{ lat: number; lng: number }>,
    ) {
      state.currentLat = action.payload.lat;
      state.currentLng = action.payload.lng;
    },
    setLocationPermission(state, action: PayloadAction<boolean>) {
      state.isLocationPermissionGranted = action.payload;
    },
  },
});

export const {
  setCurrentAddress,
  setCurrentCoordinates,
  setLocationPermission,
} = locationSlice.actions;

export default locationSlice.reducer;
