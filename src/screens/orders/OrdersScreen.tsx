// Orders Screen — Active + Past orders
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { Button } from '../../components';
import { useAppSelector } from '../../store/hooks';
import { formatCurrency, formatDate, getOrderStatusColor } from '../../utils';
import type { OrdersStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<OrdersStackParamList, 'Orders'>;

const OrdersScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { activeOrder, pastOrders } = useAppSelector((s) => s.order);

  const isEmpty = !activeOrder && pastOrders.length === 0;

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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
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
                      {activeOrder.status.replace('_', ' ')}
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
                    {order.status}
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
