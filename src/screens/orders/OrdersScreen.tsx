// Orders Screen — Active + Past orders with Firestore fetch
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { Button } from '../../components';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setPastOrders } from '../../store/slices/orderSlice';
import { formatCurrency, formatDate, getOrderStatusColor } from '../../utils';
import type { OrdersStackParamList, Order } from '../../types';

type Nav = NativeStackNavigationProp<OrdersStackParamList, 'Orders'>;

const OrdersScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { activeOrder, pastOrders } = useAppSelector((s) => s.order);
  const user = useAppSelector((s) => s.auth.user);
  const [isFetching, setIsFetching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (!user?.uid) return;
    isRefresh ? setRefreshing(true) : setIsFetching(true);
    try {
      const snapshot = await firestore()
        .collection('orders')
        .where('customerId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .limit(30)
        .get();
      const orders = snapshot.docs.map(doc => ({ orderId: doc.id, ...doc.data() } as Order));
      // Filter out active order so it doesn't appear in past orders list
      const past = orders.filter(o => o.status !== 'PLACED' && o.status !== 'CONFIRMED' &&
        o.status !== 'PREPARING' && o.status !== 'RIDER_ASSIGNED' &&
        o.status !== 'PICKED_UP' && o.status !== 'ON_THE_WAY');
      dispatch(setPastOrders(past));
    } catch (e) {
      console.log('Error fetching orders:', e);
    } finally {
      setIsFetching(false);
      setRefreshing(false);
    }
  }, [user?.uid, dispatch]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const isEmpty = !activeOrder && pastOrders.length === 0;

  if (isFetching && pastOrders.length === 0) {
    return (
      <View style={[s.container, s.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={s.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text style={s.headerTitle}>Orders</Text>

      {isEmpty ? (
        <View style={s.emptyState}>
          <Text style={s.emptyEmoji}>📦</Text>
          <Text style={s.emptyTitle}>No orders yet</Text>
          <Text style={s.emptySub}>Your order history will appear here</Text>
          <Button title="Browse Restaurants" onPress={() => {}}
            style={{ marginTop: Spacing.xl, width: 220 }} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(true)}
              colors={[Colors.primary]} tintColor={Colors.primary} />
          }
        >
          {/* Active Order */}
          {activeOrder && (
            <TouchableOpacity style={s.activeCard}
              onPress={() => navigation.navigate('OrderTracking', { orderId: activeOrder.orderId })}>
              <View style={s.activeIndicator} />
              <View style={s.activeContent}>
                <View style={s.activeTop}>
                  <Text style={s.activeName}>{activeOrder.restaurantName}</Text>
                  <View style={[s.statusBadge, { backgroundColor: getOrderStatusColor(activeOrder.status) + '20' }]}>
                    <Text style={[s.statusText, { color: getOrderStatusColor(activeOrder.status) }]}>
                      {activeOrder.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>
                <Text style={s.activeItems}>
                  {activeOrder.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                </Text>
                <Button title="Track Order" onPress={() => navigation.navigate('OrderTracking', { orderId: activeOrder.orderId })}
                  style={{ marginTop: Spacing.md, height: 40 }} />
              </View>
            </TouchableOpacity>
          )}

          {/* Past Orders */}
          {pastOrders.length > 0 && (
            <Text style={s.sectionTitle}>Past Orders</Text>
          )}
          {pastOrders.map((order) => (
            <TouchableOpacity key={order.orderId} style={s.orderCard}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order.orderId })}>
              <View style={s.orderTop}>
                <View style={s.orderInfo}>
                  <Text style={s.orderName}>{order.restaurantName}</Text>
                  <Text style={s.orderDate}>{formatDate(order.createdAt)}</Text>
                  <Text style={s.orderItems} numberOfLines={1}>
                    {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                  </Text>
                </View>
                <Text style={s.orderTotal}>{formatCurrency(order.pricing.total)}</Text>
              </View>
              <View style={s.orderBottom}>
                <View style={[s.statusBadge, { backgroundColor: getOrderStatusColor(order.status) + '20' }]}>
                  <Text style={[s.statusText, { color: getOrderStatusColor(order.status) }]}>
                    {order.status.replace(/_/g, ' ')}
                  </Text>
                </View>
                <TouchableOpacity style={s.reorderBtn}>
                  <Text style={s.reorderText}>Reorder</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.md },
  headerTitle: { ...Typography.h2, color: Colors.textPrimary, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, paddingBottom: Spacing.md },
  scrollContent: { paddingHorizontal: Spacing.xl },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h2, color: Colors.textPrimary },
  emptySub: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.xs },
  activeCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1.5,
    borderColor: Colors.primary, overflow: 'hidden', marginBottom: Spacing.xl,
  },
  activeIndicator: { height: 3, backgroundColor: Colors.primary },
  activeContent: { padding: Spacing.md },
  activeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeName: { ...Typography.bodyLarge, color: Colors.textPrimary, fontWeight: '700' },
  activeItems: { ...Typography.small, color: Colors.textSecondary, marginTop: 4 },
  sectionTitle: { ...Typography.bodyLarge, color: Colors.textPrimary, fontWeight: '700', marginBottom: Spacing.md, marginTop: Spacing.sm },
  orderCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between' },
  orderInfo: { flex: 1, marginRight: Spacing.md },
  orderName: { ...Typography.body, color: Colors.textPrimary, fontWeight: '700' },
  orderDate: { ...Typography.small, color: Colors.textSecondary, marginTop: 2 },
  orderItems: { ...Typography.small, color: Colors.textSecondary, marginTop: 4 },
  orderTotal: { ...Typography.body, color: Colors.textPrimary, fontWeight: '700' },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.xs },
  statusText: { ...Typography.small, fontWeight: '600', fontSize: 11 },
  reorderBtn: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.pill, borderWidth: 1, borderColor: Colors.textDisabled },
  reorderText: { ...Typography.small, color: Colors.textSecondary, fontWeight: '600' },
});

export default OrdersScreen;
