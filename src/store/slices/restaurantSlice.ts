// Restaurant Redux Slice
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Restaurant, MenuItem, FoodCategory, PromoBanner } from '../../types';

interface RestaurantState {
  restaurants: Restaurant[];
  currentRestaurant: Restaurant | null;
  currentMenu: MenuItem[];
  categories: FoodCategory[];
  promoBanners: PromoBanner[];
  selectedCategory: string | null;
  isLoading: boolean;
  isMenuLoading: boolean;
  error: string | null;
  searchQuery: string;
  searchResults: Restaurant[];
  recentSearches: string[];
  filterTags: string[];
  sortBy: 'rating' | 'deliveryTime' | 'deliveryFee' | null;
}

const initialState: RestaurantState = {
  restaurants: [],
  currentRestaurant: null,
  currentMenu: [],
  categories: [
    { id: '1', name: 'Pizza', emoji: '🍕' },
    { id: '2', name: 'Burgers', emoji: '🍔' },
    { id: '3', name: 'Sushi', emoji: '🍣' },
    { id: '4', name: 'Mexican', emoji: '🌮' },
    { id: '5', name: 'Chicken', emoji: '🍗' },
    { id: '6', name: 'Healthy', emoji: '🥗' },
    { id: '7', name: 'Desserts', emoji: '🧁' },
    { id: '8', name: 'Noodles', emoji: '🍜' },
    { id: '9', name: 'Indian', emoji: '🍛' },
    { id: '10', name: 'Chinese', emoji: '🥡' },
  ],
  promoBanners: [],
  selectedCategory: null,
  isLoading: false,
  isMenuLoading: false,
  error: null,
  searchQuery: '',
  searchResults: [],
  recentSearches: [],
  filterTags: [],
  sortBy: null,
};

const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState,
  reducers: {
    setRestaurants(state, action: PayloadAction<Restaurant[]>) {
      state.restaurants = action.payload;
      state.isLoading = false;
    },
    setCurrentRestaurant(state, action: PayloadAction<Restaurant | null>) {
      state.currentRestaurant = action.payload;
    },
    setCurrentMenu(state, action: PayloadAction<MenuItem[]>) {
      state.currentMenu = action.payload;
      state.isMenuLoading = false;
    },
    setPromoBanners(state, action: PayloadAction<PromoBanner[]>) {
      state.promoBanners = action.payload;
    },
    setSelectedCategory(state, action: PayloadAction<string | null>) {
      state.selectedCategory = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setMenuLoading(state, action: PayloadAction<boolean>) {
      state.isMenuLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setSearchResults(state, action: PayloadAction<Restaurant[]>) {
      state.searchResults = action.payload;
    },
    addRecentSearch(state, action: PayloadAction<string>) {
      state.recentSearches = [
        action.payload,
        ...state.recentSearches.filter((s) => s !== action.payload),
      ].slice(0, 10);
    },
    removeRecentSearch(state, action: PayloadAction<string>) {
      state.recentSearches = state.recentSearches.filter(
        (s) => s !== action.payload,
      );
    },
    clearRecentSearches(state) {
      state.recentSearches = [];
    },
    setSortBy(
      state,
      action: PayloadAction<'rating' | 'deliveryTime' | 'deliveryFee' | null>,
    ) {
      state.sortBy = action.payload;
    },
    setFilterTags(state, action: PayloadAction<string[]>) {
      state.filterTags = action.payload;
    },
  },
});

export const {
  setRestaurants,
  setCurrentRestaurant,
  setCurrentMenu,
  setPromoBanners,
  setSelectedCategory,
  setLoading,
  setMenuLoading,
  setError,
  setSearchQuery,
  setSearchResults,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  setSortBy,
  setFilterTags,
} = restaurantSlice.actions;

export default restaurantSlice.reducer;
