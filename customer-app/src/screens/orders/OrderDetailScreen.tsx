// Order Detail Screen
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { useAppSelector } from '../../store/hooks';
import { formatCurrency, formatDateTime, getOrderStatusColor, getOrderStatusText } from '../../utils';
import type { OrdersStackParamList } from '../../types';

type Route = RouteProp<OrdersStackParamList, 'OrderDetail'>;

const OrderDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { orderId } = route.params;
  const { activeOrder, pastOrders } = useAppSelector((s) => s.order);
  const order = activeOrder?.orderId === orderId ? activeOrder : pastOrders.find((o) => o.orderId === orderId);

  if (!order) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
            <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.emptyState}>
          <Text style={s.emptyEmoji}>📋</Text>
          <Text style={s.emptyTitle}>Order not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Order #{orderId.slice(-8)}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Restaurant Info */}
        <View style={s.section}>
          <Text style={s.restaurantName}>{order.restaurantName}</Text>
          <Text style={s.orderDate}>{formatDateTime(order.createdAt)}</Text>
          <View style={[s.statusBadge, { backgroundColor: getOrderStatusColor(order.status) + '20' }]}>
            <Text style={[s.statusText, { color: getOrderStatusColor(order.status) }]}>
              {order.status.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        {/* Items */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Items</Text>
          {order.items.map((item, i) => (
            <View key={i} style={s.itemRow}>
              <Text style={s.itemQty}>{item.quantity}×</Text>
              <View style={s.itemInfo}>
                <Text style={s.itemName}>{item.name}</Text>
                {item.customizations.length > 0 && (
                  <Text style={s.itemCustom}>{item.customizations.map((c) => c.optionName).join(', ')}</Text>
                )}
              </View>
              <Text style={s.itemPrice}>{formatCurrency(item.price * item.quantity)}</Text>
            </View>
          ))}
        </View>

        {/* Price Breakdown */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Bill Details</Text>
          <View style={s.priceRow}><Text style={s.priceLabel}>Subtotal</Text><Text style={s.priceVal}>{formatCurrency(order.pricing.subtotal)}</Text></View>
          <View style={s.priceRow}><Text style={s.priceLabel}>Delivery Fee</Text><Text style={s.priceVal}>{formatCurrency(order.pricing.deliveryFee)}</Text></View>
          <View style={s.priceRow}><Text style={s.priceLabel}>Taxes</Text><Text style={s.priceVal}>{formatCurrency(order.pricing.taxes)}</Text></View>
          {order.pricing.discount > 0 && (
            <View style={s.priceRow}><Text style={[s.priceLabel, { color: Colors.primary }]}>Discount</Text><Text style={[s.priceVal, { color: Colors.primary }]}>-{formatCurrency(order.pricing.discount)}</Text></View>
          )}
          <View style={s.divider} />
          <View style={s.priceRow}><Text style={s.totalLabel}>Total</Text><Text style={s.totalVal}>{formatCurrency(order.pricing.total)}</Text></View>
        </View>

        {/* Status Timeline */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Order Timeline</Text>
          {order.statusTimeline.map((entry, i) => (
            <View key={i} style={s.timelineRow}>
              <View style={s.timelineDot} />
              {i < order.statusTimeline.length - 1 && <View style={s.timelineLine} />}
              <View style={s.timelineContent}>
                <Text style={s.timelineStatus}>{getOrderStatusText(entry.status)}</Text>
                <Text style={s.timelineTime}>{formatDateTime(entry.timestamp)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Help */}
        <TouchableOpacity style={s.helpBtn}>
          <Icon name="help-circle-outline" size={20} color={Colors.primary} />
          <Text style={s.helpText}>Need help with this order?</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: Spacing.xxl, paddingBottom: Spacing.md },
  back: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { ...Typography.bodyLarge, color: Colors.textPrimary, fontWeight: '700' },
  scrollContent: { paddingHorizontal: Spacing.xl },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary },
  section: { paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  sectionTitle: { ...Typography.bodyLarge, color: Colors.textPrimary, fontWeight: '700', marginBottom: Spacing.md },
  restaurantName: { ...Typography.h2, color: Colors.textPrimary },
  orderDate: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.xs, marginTop: Spacing.sm },
  statusText: { ...Typography.small, fontWeight: '700' },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.sm, gap: Spacing.sm },
  itemQty: { ...Typography.body, color: Colors.textSecondary, width: 28 },
  itemInfo: { flex: 1 },
  itemName: { ...Typography.body, color: Colors.textPrimary, fontWeight: '500' },
  itemCustom: { ...Typography.small, color: Colors.textSecondary, marginTop: 2 },
  itemPrice: { ...Typography.body, color: Colors.textPrimary },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  priceLabel: { ...Typography.body, color: Colors.textSecondary },
  priceVal: { ...Typography.body, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.sm },
  totalLabel: { ...Typography.h3, color: Colors.textPrimary },
  totalVal: { ...Typography.h3, color: Colors.textPrimary },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md, position: 'relative' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary, marginTop: 4, marginRight: Spacing.md },
  timelineLine: { position: 'absolute', left: 5, top: 16, width: 2, height: 30, backgroundColor: Colors.surface2 },
  timelineContent: { flex: 1 },
  timelineStatus: { ...Typography.body, color: Colors.textPrimary, fontWeight: '500' },
  timelineTime: { ...Typography.small, color: Colors.textSecondary, marginTop: 2 },
  helpBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  helpText: { ...Typography.body, color: Colors.primary, fontWeight: '600' },
});

export default OrderDetailScreen;
