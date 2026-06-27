// Order Tracking Screen — live driver location, OSRM route, smart zoom, delivery PIN hidden until pickup
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated,
  Dimensions, Linking, StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Map, Camera, Marker, GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';

const OSM_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setActiveOrder, setRiderLocation, clearActiveOrder } from '../../store/slices/orderSlice';
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

// ── Haversine distance (km) ───────────────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── OSRM road-following route fetcher ────────────────────────────────────────
async function fetchOSRMRoute(
  startLat: number, startLng: number,
  endLat: number, endLng: number,
): Promise<{ latitude: number; longitude: number }[]> {
  try {
    if (startLat === 0 || endLat === 0) return [];
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 8000);
    const resp = await fetch(url, { signal: ctrl.signal });
    clearTimeout(tid);
    const data = await resp.json();
    if (data.code === 'Ok' && data.routes?.length) {
      return data.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng }),
      );
    }
    return [];
  } catch {
    return [];
  }
}

// ── Trim already-passed waypoints from route ──────────────────────────────────
function trimPassedRoute(
  route: { latitude: number; longitude: number }[],
  driverLat: number, driverLng: number,
): { latitude: number; longitude: number }[] {
  if (route.length < 2) return route;
  let minDist = Infinity;
  let closestIdx = 0;
  for (let i = 0; i < route.length; i++) {
    const d = haversineKm(driverLat, driverLng, route[i].latitude, route[i].longitude);
    if (d < minDist) { minDist = d; closestIdx = i; }
  }
  return route.slice(closestIdx);
}

// ── Big Red Drop-off Pin ──────────────────────────────────────────────────────
const RedDropPin: React.FC = () => (
  <View style={{ alignItems: 'center' }}>
    <View style={{
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: '#E8003D',
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 3, borderColor: '#FFF',
      elevation: 8, shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4, shadowRadius: 4,
    }}>
      <Icon name="map-marker" size={24} color="#FFF" />
    </View>
    <View style={{
      width: 0, height: 0,
      borderLeftWidth: 9, borderRightWidth: 9, borderTopWidth: 14,
      borderLeftColor: 'transparent', borderRightColor: 'transparent',
      borderTopColor: '#E8003D', marginTop: -3,
    }} />
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
/**
 * OrderTrackingScreen provides real-time visibility into the order lifecycle.
 * It implements a hybrid tracking strategy using Firebase Realtime Database
 * for high-frequency updates and Firestore snapshots as a robust fallback.
 */
const OrderTrackingScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<TrackingRoute>();
  const { orderId } = route.params;
  const dispatch = useAppDispatch();
  const activeOrder = useAppSelector((s) => s.order.activeOrder);

  const [order, setOrder] = useState<Order | null>(activeOrder);
  const [riderLocation, setRiderLoc] = useState<RiderLiveLocation | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const cameraRef = useRef<any>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const lastRouteFetchRef = useRef(0);
  const lastRiderLocRef = useRef<{ lat: number; lng: number } | null>(null);

  const currentStatus = order?.status || 'PLACED';
  const stageIndex = getStageIndex(currentStatus);
  const totalStages = ORDER_STAGES.length - 1;
  const progressPercent = Math.min(stageIndex / (totalStages - 1), 1);

  // Is order in delivery phase?
  const isDeliveryPhase = currentStatus === 'PICKED_UP' || currentStatus === 'ON_THE_WAY';

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progressPercent]);

  // ── Listen to order updates ───────────────────────────────────────────────
  useEffect(() => {
    const unsubOrder = orderService.onOrderSnapshot(orderId, (updatedOrder) => {
      if (updatedOrder) {
        setOrder(updatedOrder);
        dispatch(setActiveOrder(updatedOrder));

        // ── Guaranteed rider location fallback ──────────────────────────────
        // Driver app writes riderCurrentLat/Lng into the order doc every 10s.
        // Customer already has read access to their own order, so this path
        // works even if RTDB rules are not deployed and Firestore riders/ rules
        // are not deployed. RTDB listener (onRiderLocationUpdate) will take over
        // with higher-frequency updates once/if permissions allow.
        if (updatedOrder.riderCurrentLat && updatedOrder.riderCurrentLng) {
          const embeddedLoc: RiderLiveLocation = {
            lat: updatedOrder.riderCurrentLat,
            lng: updatedOrder.riderCurrentLng,
            heading: updatedOrder.riderHeading || 0,
            speed: 0,
            updatedAt: Date.now(),
            isOnline: true,
          };
          setRiderLoc(embeddedLoc);
          dispatch(setRiderLocation(embeddedLoc));
          lastRiderLocRef.current = { lat: embeddedLoc.lat, lng: embeddedLoc.lng };
        }

        if (updatedOrder.status === 'DELIVERED') {
          setTimeout(() => navigation.navigate('DeliveryConfirmed', { orderId }), 1500);
        }
        if (updatedOrder.status === 'CANCELLED') {
          dispatch(clearActiveOrder());
          // Navigate to dedicated cancelled screen with the reason shown clearly
          navigation.replace('OrderCancelled', {
            orderId,
            cancelledBy: updatedOrder.cancelledBy || 'customer',
            cancelReason: updatedOrder.cancelReason,
          });
          return;
        }
      }
    });
    return () => unsubOrder();
  }, [orderId, dispatch, navigation]);


  // ── Listen to rider live location ─────────────────────────────────────────
  // Fix #2: Use order?.riderId (local snapshot state) instead of activeOrder?.riderId
  // (Redux value which may lag behind). This ensures the listener subscribes as soon
  // as the Firestore snapshot is received, not just when Redux is updated.
  useEffect(() => {
    const rId = order?.riderId;
    if (!rId) return;
    const unsubLocation = orderService.onRiderLocationUpdate(
      rId,
      (loc) => {
        if (loc) {
          setRiderLoc(loc);
          dispatch(setRiderLocation(loc));
          lastRiderLocRef.current = { lat: loc.lat, lng: loc.lng };
        }
      },
    );
    return () => unsubLocation();
  }, [order?.riderId, dispatch]);

  // ── Fetch OSRM route when rider location or phase changes ─────────────────
  const fetchAndSetRoute = useCallback(async (riderLat: number, riderLng: number) => {
    if (!order) return;
    const now = Date.now();
    lastRouteFetchRef.current = now;

    // Pick destination based on phase
    const toLat = isDeliveryPhase ? order.deliveryAddress.lat : (order.restaurantLat || 0);
    const toLng = isDeliveryPhase ? order.deliveryAddress.lng : (order.restaurantLng || 0);

    const coords = await fetchOSRMRoute(riderLat, riderLng, toLat, toLng);
    // Only apply if this is still the latest fetch
    if (lastRouteFetchRef.current === now) {
      if (coords.length >= 2) {
        setRouteCoords(coords);
      } else {
        // Straight line fallback
        setRouteCoords([
          { latitude: riderLat, longitude: riderLng },
          { latitude: toLat, longitude: toLng },
        ]);
      }
    }
  }, [order, isDeliveryPhase]);

  // ── Update route when rider moves ─────────────────────────────────────────
  useEffect(() => {
    if (!riderLocation) return;
    const { lat: rLat, lng: rLng } = riderLocation;

    // 1. Trim already-passed waypoints
    if (routeCoords.length >= 2) {
      const trimmed = trimPassedRoute(routeCoords, rLat, rLng);
      if (trimmed.length !== routeCoords.length) {
        setRouteCoords(trimmed);
      }

      // 2. Reroute if deviated more than 60m and 25s have passed
      const nearestDist = trimmed.length > 0
        ? haversineKm(rLat, rLng, trimmed[0].latitude, trimmed[0].longitude)
        : 999;
      const timeSinceLastFetch = Date.now() - lastRouteFetchRef.current;
      if (nearestDist > 0.06 && timeSinceLastFetch > 25000) {
        fetchAndSetRoute(rLat, rLng);
        return;
      }
    }

    // 3. Initial fetch if no route yet
    if (routeCoords.length === 0) {
      fetchAndSetRoute(rLat, rLng);
    }
  }, [riderLocation?.lat, riderLocation?.lng]);

  // ── Refetch route when delivery phase changes ─────────────────────────────
  useEffect(() => {
    if (riderLocation) {
      setRouteCoords([]); // Reset route on phase change
      fetchAndSetRoute(riderLocation.lat, riderLocation.lng);
    }
  }, [isDeliveryPhase]);

  // ── Smart map zoom ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!order) return;
    const coords: { latitude: number; longitude: number }[] = [];

    // Always include rider location if available
    if (riderLocation) {
      coords.push({ latitude: riderLocation.lat, longitude: riderLocation.lng });
    }

    if (isDeliveryPhase) {
      // Delivery: show rider + drop-off, zoom in progressively as rider gets closer
      coords.push({ latitude: order.deliveryAddress.lat, longitude: order.deliveryAddress.lng });
    } else {
      // Pickup phase: show rider + restaurant + delivery location
      if (order.restaurantLat && order.restaurantLng) {
        coords.push({ latitude: order.restaurantLat, longitude: order.restaurantLng });
      }
      coords.push({ latitude: order.deliveryAddress.lat, longitude: order.deliveryAddress.lng });
    }

    if (coords.length >= 2) {
      setTimeout(() => {
        const lats = coords.map(c => c.latitude);
        const lngs = coords.map(c => c.longitude);
        cameraRef.current?.fitBounds(
          [Math.max(...lngs), Math.max(...lats)],
          [Math.min(...lngs), Math.min(...lats)],
          [60, 80, 60, 80],
          600,
        );
      }, 600);
    }
  }, [riderLocation?.lat, riderLocation?.lng, isDeliveryPhase, order]);

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

  const canCancel = currentStatus === 'PLACED' || currentStatus === 'CONFIRMED' || currentStatus === 'PREPARING' || currentStatus === 'RIDER_ASSIGNED';
  const showMap = currentStatus === 'RIDER_ASSIGNED' || currentStatus === 'PREPARING' ||
    currentStatus === 'PICKED_UP' || currentStatus === 'ON_THE_WAY';
  const hasRider = !!order?.riderId;

  // Delivery PIN only shown AFTER order is picked up
  const showDeliveryPin = (currentStatus === 'PICKED_UP' || currentStatus === 'ON_THE_WAY' || currentStatus === 'DELIVERED') && !!order?.deliveryPin;

  const getRestaurantSubtext = () => {
    switch (currentStatus) {
      case 'RIDER_ASSIGNED': return 'Your rider is heading to the restaurant';
      case 'PREPARING': return 'Restaurant is preparing your order';
      case 'PICKED_UP': return 'Your order has been picked up!';
      case 'ON_THE_WAY': return 'Your rider is on the way to you';
      default: return "We'll update you when the restaurant starts preparing...";
    }
  };

  const orderNotReady = order?.orderNotReady || false;

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Build display route
  const displayRoute = routeCoords.length >= 2 ? routeCoords : [];

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

        {/* Map */}
        {showMap ? (
          <View style={s.mapWrapper}>
            <Map
              androidView="texture"
              style={s.map}
              mapStyle={OSM_STYLE}
              attributionEnabled={true}
              logoEnabled={false}
              compassEnabled={false}>

              <Camera
                ref={cameraRef}
                zoomLevel={14}
                centerCoordinate={[
                  order?.deliveryAddress.lng || 73.8567,
                  order?.deliveryAddress.lat || 18.5204,
                ]}
              />

              {/* Restaurant marker (green circle) */}
              {order && order.restaurantLat !== undefined && order.restaurantLat !== 0 && (
                <Marker
                  id="restaurant-marker"
                  coordinate={[order.restaurantLng!, order.restaurantLat!]}>
                  <View style={s.restaurantPin}>
                    <Icon name="silverware-fork-knife" size={16} color="#FFF" />
                  </View>
                </Marker>
              )}

              {/* Delivery location marker — Big Red Teardrop Pin */}
              {order && (
                <Marker
                  id="drop-marker"
                  coordinate={[order.deliveryAddress.lng, order.deliveryAddress.lat]}>
                  <RedDropPin />
                </Marker>
              )}

              {/* Rider live location — bike icon */}
              {riderLocation && (
                <Marker
                  id="rider-marker"
                  coordinate={[riderLocation.lng, riderLocation.lat]}>
                  <View style={s.riderMarker}>
                    <Icon name="motorbike" size={22} color="#000" />
                  </View>
                </Marker>
              )}

              {/* Road-following route — bold and dark */}
              {riderLocation && displayRoute.length >= 2 && (
                <GeoJSONSource
                  id="tracking-route"
                  data={{
                    type: 'Feature',
                    properties: {},
                    geometry: {
                      type: 'LineString',
                      coordinates: displayRoute.map(c => [c.longitude, c.latitude]),
                    },
                  }}>
                  <Layer
                    id="tracking-route-layer"
                    type="line"
                    paint={{
                      'line-color': '#1A1A2E',
                      'line-width': 6,
                    }}
                  />
                </GeoJSONSource>
              )}

              {/* Fallback straight line if no OSRM route yet */}
              {riderLocation && displayRoute.length === 0 && order && (
                <GeoJSONSource
                  id="fallback-route"
                  data={{
                    type: 'Feature',
                    properties: {},
                    geometry: {
                      type: 'LineString',
                      coordinates: [
                        [riderLocation.lng, riderLocation.lat],
                        isDeliveryPhase
                          ? [order.deliveryAddress.lng, order.deliveryAddress.lat]
                          : [order.restaurantLng || 0, order.restaurantLat || 0],
                      ],
                    },
                  }}>
                  <Layer
                    id="fallback-route-layer"
                    type="line"
                    paint={{
                      'line-color': '#1A1A2E',
                      'line-width': 6,
                    }}
                  />
                </GeoJSONSource>
              )}
            </Map>
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

        {/* Delivery PIN card — ONLY show after order is picked up */}
        {showDeliveryPin && (
          <View style={[s.pinCard, { backgroundColor: isDark ? '#1A1A1A' : '#F8F8F8' }]}>
            <View style={s.pinHeader}>
              <Icon name="lock-outline" size={20} color={colors.primary} />
              <Text style={[s.pinLabel, { color: colors.textPrimary }]}>Delivery PIN</Text>
            </View>
            <Text style={[s.pinCode, { color: colors.textPrimary }]}>{order!.deliveryPin}</Text>
            <Text style={[s.pinHint, { color: colors.textSecondary }]}>
              Share this PIN with your delivery partner when they arrive
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
  mapWrapper: { height: 300 },
  map: { flex: 1 },
  restaurantPin: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#06C167', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  // Rider marker — white circle with bike icon
  riderMarker: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4,
    borderWidth: 2, borderColor: '#E0E0E0',
  },
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
