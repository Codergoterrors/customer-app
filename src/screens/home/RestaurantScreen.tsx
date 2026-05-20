// Restaurant Screen — Menu, header parallax, sticky tabs, floating cart
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  Animated, Dimensions, FlatList, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { addToCart, selectCartItemCount, selectCartSubtotal } from '../../store/slices/cartSlice';
import { restaurantService } from '../../services/restaurantService';
import { formatCurrency, getDeliveryTimeRange } from '../../utils';
import type { HomeStackParamList, MenuItem, Restaurant } from '../../types';

const { width: SW } = Dimensions.get('window');
const HEADER_H = 220;
type Nav = NativeStackNavigationProp<HomeStackParamList, 'Restaurant'>;
type Route = RouteProp<HomeStackParamList, 'Restaurant'>;

const RestaurantScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const dispatch = useAppDispatch();
  const { restaurantId } = route.params;

  // All useState hooks first
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Menu');
  const [activeCategory, setActiveCategory] = useState('');
  const [isFav, setIsFav] = useState(false);

  // All useRef hooks
  const scrollY = useRef(new Animated.Value(0)).current;

  // All useAppSelector hooks
  const cartCount = useAppSelector(selectCartItemCount);
  const cartTotal = useAppSelector(selectCartSubtotal);

  // All useEffect hooks
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [rest, menuData] = await Promise.all([
          restaurantService.getRestaurant(restaurantId),
          restaurantService.getMenu(restaurantId),
        ]);
        if (!cancelled) {
          setRestaurant(rest);
          setMenu(menuData);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading restaurant:', error);
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [restaurantId]);

  // All useMemo hooks
  const categories = useMemo(() => [...new Set(menu.map((m) => m.category))], [menu]);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const handleAddToCart = useCallback((item: MenuItem) => {
    if (!restaurant) return;
    dispatch(addToCart({
      itemId: item.id, restaurantId: restaurant.id, restaurantName: restaurant.name,
      name: item.name, price: item.price, quantity: 1, imageUrl: item.imageUrl, customizations: [],
    }));
  }, [dispatch, restaurant]);

  const stickyOpacity = scrollY.interpolate({ inputRange: [HEADER_H - 80, HEADER_H], outputRange: [0, 1], extrapolate: 'clamp' });

  const groupedMenu = useMemo(() => {
    return categories.map((cat) => ({ category: cat, items: menu.filter((m) => m.category === cat) }));
  }, [categories, menu]);

  // Loading state — rendered AFTER all hooks
  if (isLoading || !restaurant) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Sticky Header */}
      <Animated.View style={[s.stickyHeader, { opacity: stickyOpacity }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.stickyBack}>
          <Icon name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.stickyTitle} numberOfLines={1}>{restaurant.name}</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <Animated.ScrollView showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}>

        {/* Header Image */}
        <View style={s.headerImage}>
          <Image source={{ uri: restaurant.headerImageUrl }} style={s.heroImg} />
          <View style={s.heroOverlay} />
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={22} color={Colors.black} />
          </TouchableOpacity>
          <TouchableOpacity style={s.favBtn} onPress={() => setIsFav(!isFav)}>
            <Icon name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? Colors.error : Colors.black} />
          </TouchableOpacity>
        </View>

        {/* Restaurant Info */}
        <View style={s.infoCard}>
          <Text style={s.restName}>{restaurant.name}</Text>
          <View style={s.metaRow}>
            <Text style={s.cuisine}>{restaurant.cuisineType.join(' · ')}</Text>
          </View>
          <View style={s.statsRow}>
            <View style={s.stat}>
              <Icon name="star" size={16} color={Colors.starYellow} />
              <Text style={s.statText}>{restaurant.rating} ({restaurant.totalReviews})</Text>
            </View>
            <View style={s.statDot} />
            <View style={s.stat}>
              <Icon name="clock-outline" size={16} color={Colors.textSecondary} />
              <Text style={s.statText}>{getDeliveryTimeRange(restaurant.deliveryTimeMinutes)}</Text>
            </View>
            <View style={s.statDot} />
            <View style={s.stat}>
              <Icon name="moped" size={16} color={Colors.textSecondary} />
              <Text style={s.statText}>{formatCurrency(restaurant.deliveryFee)}</Text>
            </View>
          </View>
        </View>

        {/* Tab Bar */}
        <View style={s.tabBar}>
          {['Menu', 'Info'].map((tab) => (
            <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && s.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'Menu' ? (
          <>
            {/* Category Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll} contentContainerStyle={s.catContent}>
              {categories.map((cat) => (
                <TouchableOpacity key={cat} style={[s.catPill, activeCategory === cat && s.catPillActive]} onPress={() => setActiveCategory(cat)}>
                  <Text style={[s.catPillText, activeCategory === cat && s.catPillTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Menu Items */}
            {groupedMenu.map(({ category, items }) => (
              <View key={category} style={s.menuSection}>
                <Text style={s.menuCatTitle}>{category}</Text>
                {items.map((item) => (
                  <View key={item.id} style={s.menuItem}>
                    <View style={s.menuItemLeft}>
                      <View style={s.vegBadge}>
                        <View style={[s.vegDot, { backgroundColor: item.isVeg ? '#06C167' : '#FF4444' }]} />
                      </View>
                      <Text style={s.menuItemName}>{item.name}</Text>
                      <Text style={s.menuItemDesc} numberOfLines={2}>{item.description}</Text>
                      <Text style={s.menuItemPrice}>{formatCurrency(item.price)}</Text>
                    </View>
                    <View style={s.menuItemRight}>
                      <Image source={{ uri: item.imageUrl }} style={s.menuItemImg} />
                      <TouchableOpacity style={s.addBtn} onPress={() => handleAddToCart(item)}>
                        <Icon name="plus" size={18} color={Colors.white} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </>
        ) : (
          /* Info Tab */
          <View style={s.infoTab}>
            <View style={s.infoMapPlaceholder}>
              <Icon name="map-marker" size={32} color={Colors.primary} />
            </View>
            <Text style={s.infoLabel}>Address</Text>
            <Text style={s.infoValue}>{restaurant.address.fullAddress}</Text>
            <Text style={s.infoLabel}>Phone</Text>
            <Text style={s.infoValue}>{restaurant.phone}</Text>
            <Text style={s.infoLabel}>About</Text>
            <Text style={s.infoValue}>{restaurant.description}</Text>
          </View>
        )}
        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <TouchableOpacity style={s.cartBtn} onPress={() => navigation.navigate('Cart')} activeOpacity={0.9}>
          <Text style={s.cartBtnText}>View Cart · {cartCount} items · {formatCurrency(cartTotal)}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  stickyHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.background, paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  stickyBack: { width: 40, height: 40, justifyContent: 'center' },
  stickyTitle: { ...Typography.bodyLarge, color: Colors.textPrimary, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerImage: { height: HEADER_H, position: 'relative' },
  heroImg: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, background: 'transparent' },
  backBtn: {
    position: 'absolute', top: Spacing.xxl, left: Spacing.base,
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center', elevation: 4,
  },
  favBtn: {
    position: 'absolute', top: Spacing.xxl, right: Spacing.base,
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center', elevation: 4,
  },
  infoCard: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  restName: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', marginTop: 4 },
  cuisine: { ...Typography.body, color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, gap: Spacing.sm },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { ...Typography.small, color: Colors.textSecondary },
  statDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.textDisabled },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.divider, paddingHorizontal: Spacing.xl },
  tab: { paddingVertical: Spacing.md, marginRight: Spacing.xxl },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { ...Typography.bodyLarge, color: Colors.textDisabled, fontWeight: '600' },
  tabTextActive: { color: Colors.textPrimary },
  catScroll: { marginTop: Spacing.md },
  catContent: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  catPill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.pill, backgroundColor: Colors.surface },
  catPillActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  catPillText: { ...Typography.body, color: Colors.textSecondary },
  catPillTextActive: { color: Colors.textPrimary, fontWeight: '600' },
  menuSection: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  menuCatTitle: { ...Typography.bodyLarge, color: Colors.textPrimary, fontWeight: '700', marginBottom: Spacing.md },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  menuItemLeft: { flex: 1, paddingRight: Spacing.md },
  vegBadge: { marginBottom: 4 },
  vegDot: { width: 10, height: 10, borderRadius: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  menuItemName: { ...Typography.body, color: Colors.textPrimary, fontWeight: '700' },
  menuItemDesc: { ...Typography.small, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
  menuItemPrice: { ...Typography.body, color: Colors.textPrimary, fontWeight: '700', marginTop: Spacing.sm },
  menuItemRight: { position: 'relative' },
  menuItemImg: { width: 80, height: 80, borderRadius: BorderRadius.sm },
  addBtn: {
    position: 'absolute', bottom: -6, right: -6,
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', elevation: 4,
  },
  cartBtn: {
    position: 'absolute', bottom: Spacing.xl, left: Spacing.base, right: Spacing.base,
    backgroundColor: Colors.primary, height: 52, borderRadius: BorderRadius.pill,
    justifyContent: 'center', alignItems: 'center', elevation: 8,
  },
  cartBtnText: { ...Typography.button, color: Colors.textInverse },
  infoTab: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  infoMapPlaceholder: {
    height: 150, backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl,
  },
  infoLabel: { ...Typography.label, color: Colors.textSecondary, marginTop: Spacing.lg, marginBottom: Spacing.xs },
  infoValue: { ...Typography.body, color: Colors.textPrimary, lineHeight: 22 },
});

export default RestaurantScreen;
