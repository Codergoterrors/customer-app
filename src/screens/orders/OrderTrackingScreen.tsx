// Order Tracking Screen — with live driver location, delivery PIN, correct status
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated,
  Dimensions, Linking, StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setActiveOrder, setRiderLocation } from '../../store/slices/orderSlice';
import { orderService } from '../../services';
import { useTheme } from '../../theme/ThemeContext';
import type { HomeStackParamList, OrderStatus, Order, RiderLiveLocation } from '../../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'OrderTracking'>;
type TrackingRoute = RouteProp<HomeStackParamList, 'OrderTracking'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ORDER_STAGES = [
  { key: 'PLACED', label: 'Order received' },
  { key: 'CONFIRMED', label: 'Order confirmed' },
  { key: 'PREPARING', label: 'Preparing your order...' },
  { key: 'RIDER_ASSIGNED', label: 'Rider on the way to restaurant...' },
  { key: 'PICKED_UP', label: 'Order picked up — on the way!' },
  { key: 'ON_THE_WAY', label: 'On the way to you...' },
  { key: 'DELIVERED', label: 'Delivered!' },
] as const;

const getStageIndex = (status: OrderStatus): number => {
  const idx = ORDER_STAGES.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
};

const getStageLabel = (status: OrderStatus): string => {
  const stage = ORDER_STAGES.find((s) => s.key === status);
  return stage?.label || 'Order received';
};

const OrderTrackingScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<TrackingRoute>();
  const { orderId } = route.params;
  const dispatch = useAppDispatch();
  const activeOrder = useAppSelector((s) => s.order.activeOrder);

  const [order, setOrder] = useState<Order | null>(activeOrder);
  const [riderLocation, setRiderLoc] = useState<RiderLiveLocation | null>(null);
  const mapRef = useRef<MapView>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const currentStatus = order?.status || 'PLACED';
  const stageIndex = getStageIndex(currentStatus);
  const totalStages = ORDER_STAGES.length - 1;
  const progressPercent = Math.min(stageIndex / (totalStages - 1), 1);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progressPercent]);

  // Listen to order updates
  useEffect(() => {
    const unsubOrder = orderService.onOrderSnapshot(orderId, (updatedOrder) => {
      if (updatedOrder) {
        setOrder(updatedOrder);
        dispatch(setActiveOrder(updatedOrder));
        if (updatedOrder.status === 'DELIVERED') {
          setTimeout(() => navigation.navigate('DeliveryConfirmed', { orderId }), 1500);
        }
      }
    });
    return () => unsubOrder();
  }, [orderId, dispatch, navigation]);

  // Listen to rider live location — continuously
  useEffect(() => {
    if (!order?.riderId) return;
    const unsubLocation = orderService.onRiderLocationUpdate(
      order.riderId,
      (loc) => {
        if (loc) {
          setRiderLoc(loc);
          dispatch(setRiderLocation(loc));
        }
      },
    );
    return () => unsubLocation();
  }, [order?.riderId, dispatch]);

  // Fit map to show rider and delivery point
  useEffect(() => {
    if (!order) return;
    const coords: { latitude: number; longitude: number }[] = [
      { latitude: order.deliveryAddress.lat, longitude: order.deliveryAddress.lng },
    ];
    if (riderLocation) {
      coords.push({ latitude: riderLocation.lat, longitude: riderLocation.lng });
    }
    if (order.restaurantLat && order.restaurantLng) {
      coords.push({ latitude: order.restaurantLat, longitude: order.restaurantLng });
    }
    if (coords.length >= 2) {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }
  }, [riderLocation, order]);

  const estimatedArrival = useMemo(() => {
    if (!order) return '';
    const eta = new Date(Date.now() + (order.estimatedDeliveryTime || 30) * 60000);
    return eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [order]);

  const latestArrival = useMemo(() => {
    if (!order) return '';
    const late = new Date(Date.now() + ((order.estimatedDeliveryTime || 30) + 15) * 60000);
    return late.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [order]);

  const canCancel = currentStatus === 'PLACED' || currentStatus === 'CONFIRMED' || currentStatus === 'PREPARING';
  // Show map whenever a rider is assigned (all stages from RIDER_ASSIGNED onward)
  const showMap = currentStatus === 'RIDER_ASSIGNED' || currentStatus === 'PREPARING' ||
    currentStatus === 'PICKED_UP' || currentStatus === 'ON_THE_WAY';
  const hasRider = !!order?.riderId;

  // Status-specific subtext for restaurant card
  const getRestaurantSubtext = () => {
    switch (currentStatus) {
      case 'RIDER_ASSIGNED': return 'Your rider is heading to the restaurant';
      case 'PREPARING': return 'Restaurant is preparing your order';
      case 'PICKED_UP': return 'Your order has been picked up!';
      case 'ON_THE_WAY': return 'Your rider is on the way to you';
      default: return "We'll update you when the restaurant starts preparing...";
    }
  };

  // "Order not ready" notification
  const orderNotReady = order?.orderNotReady || false;

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Top Bar */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
          <Icon name="close" size={24} color={colors.closeIconColor} />
        </TouchableOpacity>
        <View style={s.topBarRight}>
          <TouchableOpacity style={[s.shareBtn, { backgroundColor: colors.shareBtnBg }]}>
            <Icon name="export-variant" size={20} color={colors.iconDefault} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.helpPill, { backgroundColor: colors.helpPillBg }]}
            onPress={() => navigation.navigate('Help', { orderId, canCancel })}>
            <Text style={[s.helpPillText, { color: colors.helpPillText }]}>Help</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Status */}
        <View style={s.statusSection}>
          <Text style={[s.statusTitle, { color: colors.textPrimary }]}>{getStageLabel(currentStatus)}</Text>
          <Text style={[s.etaText, { color: colors.textSecondary }]}>
            Estimated arrival <Text style={[s.etaBold, { color: colors.textPrimary }]}>{estimatedArrival}</Text>
          </Text>
          <View style={[s.progressTrack, { backgroundColor: colors.progressTrack }]}>
            <Animated.View style={[s.progressFill, { width: progressBarWidth, backgroundColor: colors.progressFill }]} />
          </View>
          {currentStatus !== 'PLACED' && currentStatus !== 'DELIVERED' && (
            <Text style={[s.latestArrival, { color: colors.textSecondary }]}>
              Latest arrival by {latestArrival} <Icon name="information-outline" size={14} color={colors.textSecondary} />
            </Text>
          )}
        </View>

        {/* Order not ready notification */}
        {orderNotReady && (
          <View style={s.notReadyBanner}>
            <Icon name="clock-alert-outline" size={20} color="#F5A623" />
            <Text style={s.notReadyText}>Order is not ready yet at the restaurant</Text>
          </View>
        )}

        <View style={[s.divider, { backgroundColor: colors.divider }]} />

        {/* Map or Illustration */}
        {showMap ? (
          <View style={s.mapWrapper}>
            <MapView
              ref={mapRef}
              style={s.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: order?.deliveryAddress.lat || 18.5204,
                longitude: order?.deliveryAddress.lng || 73.8567,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              }}
              showsUserLocation={false}>
              {/* Restaurant marker (green) */}
              {order && order.restaurantLat !== 0 && (
                <Marker coordinate={{ latitude: order.restaurantLat, longitude: order.restaurantLng }} anchor={{ x: 0.5, y: 0.5 }}>
                  <View style={s.restaurantPin}><Icon name="silverware-fork-knife" size={16} color="#FFF" /></View>
                </Marker>
              )}
              {/* Delivery location marker (black) */}
              {order && (
                <Marker coordinate={{ latitude: order.deliveryAddress.lat, longitude: order.deliveryAddress.lng }} anchor={{ x: 0.5, y: 1 }}>
                  <View style={s.deliveryPin}><View style={s.deliveryPinDot} /></View>
                </Marker>
              )}
              {/* Rider live location marker */}
              {riderLocation && (
                <Marker coordinate={{ latitude: riderLocation.lat, longitude: riderLocation.lng }} anchor={{ x: 0.5, y: 0.5 }}>
                  <View style={s.riderMarker}><Icon name="motorbike" size={20} color="#000" /></View>
                </Marker>
              )}
              {/* Route line: rider to destination */}
              {riderLocation && order && (
                <Polyline
                  coordinates={
                    currentStatus === 'PICKED_UP' || currentStatus === 'ON_THE_WAY'
                      ? [
                          { latitude: riderLocation.lat, longitude: riderLocation.lng },
                          { latitude: order.deliveryAddress.lat, longitude: order.deliveryAddress.lng },
                        ]
                      : [
                          { latitude: riderLocation.lat, longitude: riderLocation.lng },
                          { latitude: order.restaurantLat, longitude: order.restaurantLng },
                          { latitude: order.deliveryAddress.lat, longitude: order.deliveryAddress.lng },
                        ]
                  }
                  strokeColor="#000"
                  strokeWidth={3}
                />
              )}
            </MapView>
          </View>
        ) : (
          <View style={[s.illustrationSection, { backgroundColor: isDark ? '#0A0A0A' : '#FAFAFA' }]}>
            <View style={[s.illustrationPlaceholder, { backgroundColor: isDark ? '#0D2818' : '#E8F8EE' }]}>
              <Icon
                name={currentStatus === 'PLACED' ? 'clipboard-check-outline' : currentStatus === 'CONFIRMED' ? 'store-check-outline' : 'pot-steam-outline'}
                size={80}
                color={colors.primary}
              />
            </View>
          </View>
        )}

        {/* Delivery PIN card — show when rider is assigned */}
        {hasRider && order?.deliveryPin && (
          <View style={[s.pinCard, { backgroundColor: isDark ? '#1A1A1A' : '#F8F8F8' }]}>
            <View style={s.pinHeader}>
              <Icon name="lock-outline" size={20} color={colors.primary} />
              <Text style={[s.pinLabel, { color: colors.textPrimary }]}>Delivery PIN</Text>
            </View>
            <Text style={[s.pinCode, { color: colors.textPrimary }]}>{order.deliveryPin}</Text>
            <Text style={[s.pinHint, { color: colors.textSecondary }]}>
              Share this PIN with your delivery partner to confirm delivery
            </Text>
          </View>
        )}

        {/* Rider Card */}
        {hasRider && (
          <View style={s.riderSection}>
            <View style={s.riderCardTop}>
              <View style={s.riderAvatarContainer}>
                <View style={[s.riderAvatar, { backgroundColor: colors.surface }]}>
                  <Icon name="account" size={32} color={colors.textSecondary} />
                </View>
              </View>
              <View style={s.riderDetails}>
                <View style={s.riderNameRow}>
                  <Icon name="shield-check" size={16} color={colors.primary} />
                  <Text style={[s.riderName, { color: colors.textPrimary }]}>{order?.riderName || 'Driver'}</Text>
                  <Text style={[s.riderPlate, { color: colors.textSecondary }]}> · {order?.riderPlateNumber || ''}</Text>
                </View>
                <Text style={[s.riderVehicle, { color: colors.textSecondary }]}>{order?.riderVehicle || 'Bike'}</Text>
              </View>
            </View>
            <View style={s.riderActions}>
              <TouchableOpacity
                style={[s.riderActionBtn, { backgroundColor: colors.riderActionBg }]}
                onPress={() => order?.riderPhone && Linking.openURL(`sms:${order.riderPhone}`)}>
                <Icon name="message-text-outline" size={18} color={colors.iconDefault} />
                <Text style={[s.riderActionText, { color: colors.textPrimary }]}>Send a message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.riderActionBtn, { backgroundColor: colors.riderActionBg }]}>
                <Icon name="hand-heart-outline" size={18} color={colors.iconDefault} />
                <Text style={[s.riderActionText, { color: colors.textPrimary }]}>Tip</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={[s.divider, { backgroundColor: colors.divider }]} />

        {/* Restaurant Card */}
        <TouchableOpacity style={s.restaurantCard} activeOpacity={0.7}>
          <View style={s.restaurantDot} />
          <View style={s.restaurantInfo}>
            <Text style={[s.restaurantName, { color: colors.textPrimary }]}>{order?.restaurantName || 'Restaurant'}</Text>
            <Text style={[s.restaurantSubtext, { color: colors.textSecondary }]}>{getRestaurantSubtext()}</Text>
          </View>
          <Icon name="chevron-right" size={22} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={[s.divider, { backgroundColor: colors.divider }]} />

        {/* Order Items Preview */}
        <View style={s.itemsPreview}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(order?.items || []).map((item, idx) => (
              <View key={idx} style={[s.itemThumb, { backgroundColor: colors.surface }]}>
                <Icon name="food" size={24} color={colors.textSecondary} />
                <Text style={[s.itemThumbQty, { color: colors.textSecondary }]}>{item.quantity}×</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  helpPill: { height: 36, paddingHorizontal: 16, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  helpPillText: { fontSize: 14, fontWeight: '600' },
  scroll: { flex: 1 },
  statusSection: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  statusTitle: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5, marginBottom: 6 },
  etaText: { fontSize: 15, marginBottom: 16 },
  etaBold: { fontWeight: '700' },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  latestArrival: { fontSize: 13, marginTop: 10 },
  notReadyBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF8E1', paddingHorizontal: 20, paddingVertical: 12, marginHorizontal: 16, borderRadius: 8, marginBottom: 8 },
  notReadyText: { fontSize: 14, fontWeight: '600', color: '#F5A623', flex: 1 },
  divider: { height: 1 },
  mapWrapper: { height: 280 },
  map: { flex: 1 },
  restaurantPin: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#06C167', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  deliveryPin: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  deliveryPinDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' },
  riderMarker: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  illustrationSection: { paddingVertical: 40, alignItems: 'center' },
  illustrationPlaceholder: { width: 160, height: 160, borderRadius: 80, justifyContent: 'center', alignItems: 'center' },
  pinCard: { marginHorizontal: 16, borderRadius: 12, padding: 16, marginVertical: 12, alignItems: 'center' },
  pinHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  pinLabel: { fontSize: 14, fontWeight: '600' },
  pinCode: { fontSize: 36, fontWeight: '800', letterSpacing: 8, marginBottom: 6 },
  pinHint: { fontSize: 12, textAlign: 'center' },
  riderSection: { paddingHorizontal: 20, paddingVertical: 16 },
  riderCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  riderAvatarContainer: { position: 'relative' },
  riderAvatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  riderDetails: { flex: 1 },
  riderNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  riderName: { fontSize: 16, fontWeight: '700' },
  riderPlate: { fontSize: 14, fontWeight: '500' },
  riderVehicle: { fontSize: 14, marginTop: 2 },
  riderActions: { flexDirection: 'row', gap: 10 },
  riderActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 22 },
  riderActionText: { fontSize: 14, fontWeight: '600' },
  restaurantCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, gap: 12 },
  restaurantDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#06C167' },
  restaurantInfo: { flex: 1 },
  restaurantName: { fontSize: 16, fontWeight: '700' },
  restaurantSubtext: { fontSize: 13, marginTop: 2 },
  itemsPreview: { paddingHorizontal: 20, paddingVertical: 16 },
  itemThumb: { width: 52, height: 52, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8, position: 'relative' },
  itemThumbQty: { position: 'absolute', bottom: 2, right: 4, fontSize: 10, fontWeight: '700' },
});

export default OrderTrackingScreen;
