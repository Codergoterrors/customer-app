// Home Screen — Main feed with restaurants, promos, categories, theme support
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  FlatList, RefreshControl, Animated, Dimensions, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Typography, Spacing, BorderRadius, ComponentHeight } from '../../constants';
import { RestaurantCard, RestaurantCardSkeleton, SmallRestaurantCardSkeleton, SelectAddressSheet } from '../../components';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setRestaurants, setSelectedCategory } from '../../store/slices/restaurantSlice';
import { MOCK_PROMO_BANNERS } from '../../utils/mockData';
import { restaurantService } from '../../services/restaurantService';
import { truncateText } from '../../utils';
import { useTheme } from '../../theme/ThemeContext';
import type { HomeStackParamList, Restaurant, FoodCategory } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
type HomeNav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

const CATEGORIES: FoodCategory[] = [
  { id: '1', name: 'Pizza', emoji: '🍕' },
  { id: '2', name: 'Burgers', emoji: '🍔' },
  { id: '3', name: 'Sushi', emoji: '🍣' },
  { id: '4', name: 'Mexican', emoji: '🌮' },
  { id: '5', name: 'Chicken', emoji: '🍗' },
  { id: '6', name: 'Healthy', emoji: '🥗' },
  { id: '7', name: 'Desserts', emoji: '🧁' },
  { id: '8', name: 'Noodles', emoji: '🍜' },
  { id: '9', name: 'Indian', emoji: '🍛' },
];

const HomeScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<HomeNav>();
  const dispatch = useAppDispatch();
  const { restaurants, selectedCategory } = useAppSelector((s) => s.restaurant);
  const currentAddress = useAppSelector((s) => s.location.currentAddress);

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const promoScrollRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!currentAddress && !isLoading) {
      const timer = setTimeout(() => setShowAddressSheet(true), 500);
      return () => clearTimeout(timer);
    }
  }, [currentAddress, isLoading]);

  useEffect(() => {
    let cancelled = false;
    const fetchRestaurants = async () => {
      try {
        const data = await restaurantService.getRestaurants();
        if (!cancelled) {
          dispatch(setRestaurants(data));
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading restaurants:', error);
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchRestaurants();
    return () => { cancelled = true; };
  }, [dispatch]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (activePromoIndex + 1) % MOCK_PROMO_BANNERS.length;
      promoScrollRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActivePromoIndex(nextIndex);
    }, 3000);
    return () => clearInterval(interval);
  }, [activePromoIndex]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await restaurantService.getRestaurants();
      dispatch(setRestaurants(data));
    } catch (error) {
      console.error('Error refreshing restaurants:', error);
    }
    setRefreshing(false);
  }, [dispatch]);

  const handleRestaurantPress = useCallback((restaurant: Restaurant) => {
    navigation.navigate('Restaurant', { restaurantId: restaurant.id });
  }, [navigation]);

  const handleCategoryPress = useCallback((category: FoodCategory) => {
    dispatch(setSelectedCategory(selectedCategory === category.name ? null : category.name));
  }, [dispatch, selectedCategory]);

  const filteredRestaurants = useMemo(() => {
    if (!selectedCategory) return restaurants;
    return restaurants.filter((r) => r.cuisineType.some((c) => c.toLowerCase().includes(selectedCategory.toLowerCase())));
  }, [restaurants, selectedCategory]);

  const topPicks = useMemo(() => [...restaurants].sort((a, b) => b.rating - a.rating).slice(0, 5), [restaurants]);

  const headerShadowOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 0.3],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <Animated.View style={[styles.topBar, { backgroundColor: colors.background, shadowOpacity: headerShadowOpacity }]}>
        <TouchableOpacity style={styles.addressRow} onPress={() => setShowAddressSheet(true)}>
          <Icon name="map-marker" size={20} color={colors.primary} />
          <Text style={[styles.addressText, { color: colors.textPrimary }]} numberOfLines={1}>
            {currentAddress?.fullAddress ? truncateText(currentAddress.fullAddress, 30) : 'Set delivery location'}
          </Text>
          <Icon name="chevron-down" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.avatarBtn} onPress={() => (navigation as any).navigate('Account')}>
          <Icon name="account-circle" size={36} color={colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <TouchableOpacity style={[styles.searchBar, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('Search')} activeOpacity={0.8}>
          <Icon name="magnify" size={22} color={colors.textDisabled} />
          <Text style={[styles.searchPlaceholder, { color: colors.textDisabled }]}>Search for restaurants or dishes</Text>
        </TouchableOpacity>

        <View style={styles.promoSection}>
          <FlatList
            ref={promoScrollRef}
            data={MOCK_PROMO_BANNERS}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 48));
              setActivePromoIndex(index);
            }}
            renderItem={({ item }) => (
              <View style={styles.promoCard}>
                <Image source={{ uri: item.imageUrl }} style={styles.promoImage} />
                <View style={styles.promoOverlay}>
                  <Text style={styles.promoTitle}>{item.title}</Text>
                  <Text style={styles.promoSub}>{item.subtitle}</Text>
                </View>
              </View>
            )}
          />
          <View style={styles.promoDots}>
            {MOCK_PROMO_BANNERS.map((_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: colors.surface2 }, i === activePromoIndex && [styles.dotActive, { backgroundColor: colors.primary }]]} />
            ))}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll} contentContainerStyle={styles.categoriesContent}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.id}
              style={[styles.categoryChip, { backgroundColor: colors.surface }, selectedCategory === cat.name && { backgroundColor: colors.primary }]}
              onPress={() => handleCategoryPress(cat)} activeOpacity={0.7}>
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={[styles.categoryLabel, { color: colors.textPrimary }, selectedCategory === cat.name && { color: colors.white, fontWeight: '700' }]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Top Picks for You</Text>
            <TouchableOpacity><Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text></TouchableOpacity>
          </View>
          {isLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[1, 2, 3].map((i) => <SmallRestaurantCardSkeleton key={i} />)}
            </ScrollView>
          ) : (
            <FlatList data={topPicks} horizontal showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <RestaurantCard restaurant={item} onPress={handleRestaurantPress} compact />}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: Spacing.md }]}>All Restaurants</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {['Sort by', 'Free Delivery', 'Rating 4.0+'].map((label) => (
              <TouchableOpacity key={label} style={[styles.filterChip, { backgroundColor: colors.surface }]}>
                <Text style={[styles.filterText, { color: colors.textSecondary }]}>{label}</Text>
                {label === 'Sort by' && <Icon name="chevron-down" size={14} color={colors.textSecondary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
          {isLoading ? (
            [1, 2, 3].map((i) => <RestaurantCardSkeleton key={i} />)
          ) : (
            filteredRestaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} onPress={handleRestaurantPress} />)
          )}
          {!isLoading && filteredRestaurants.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No restaurants found</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Try a different category</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      <SelectAddressSheet visible={showAddressSheet} onClose={() => setShowAddressSheet(false)} onAddNew={() => navigation.navigate('AddAddress')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.base, paddingBottom: Spacing.sm,
    zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 4,
  },
  addressRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 },
  addressText: { ...Typography.bodyLarge, fontWeight: '600', flex: 1 },
  avatarBtn: { marginLeft: Spacing.md },
  scroll: { flex: 1 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', height: ComponentHeight.searchBar,
    borderRadius: BorderRadius.pill, paddingHorizontal: Spacing.base, marginHorizontal: Spacing.xl,
    marginTop: Spacing.md, marginBottom: Spacing.lg, gap: Spacing.sm,
  },
  searchPlaceholder: { ...Typography.body },
  promoSection: { marginBottom: Spacing.lg },
  promoCard: { width: SCREEN_WIDTH - 48, height: 150, borderRadius: BorderRadius.md, overflow: 'hidden', marginHorizontal: Spacing.xl },
  promoImage: { width: '100%', height: '100%' },
  promoOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end', padding: Spacing.base },
  promoTitle: { ...Typography.h3, color: '#FFFFFF', fontWeight: '700' },
  promoSub: { ...Typography.small, color: 'rgba(255,255,255,0.85)' },
  promoDots: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.sm, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { width: 20 },
  categoriesScroll: { marginBottom: Spacing.lg },
  categoriesContent: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  categoryChip: { flexDirection: 'row', alignItems: 'center', height: ComponentHeight.categoryChip, borderRadius: BorderRadius.pill, paddingHorizontal: Spacing.md, gap: 6 },
  categoryEmoji: { fontSize: 16 },
  categoryLabel: { ...Typography.small, fontWeight: '500' },
  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { ...Typography.bodyLarge, fontWeight: '700' },
  seeAll: { ...Typography.body, fontWeight: '600' },
  filterRow: { marginBottom: Spacing.md },
  filterChip: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.pill, paddingHorizontal: Spacing.md, height: 32, marginRight: Spacing.sm, gap: 4 },
  filterText: { ...Typography.small },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyText: { ...Typography.h3 },
  emptySubtext: { ...Typography.body, marginTop: Spacing.xs },
});

export default HomeScreen;
