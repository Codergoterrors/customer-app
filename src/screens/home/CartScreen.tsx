// Cart Screen
import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { Button } from '../../components';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateItemQuantity, removeFromCart, applyPromo, removePromo } from '../../store/slices/cartSlice';
import { formatCurrency } from '../../utils';
import type { HomeStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Cart'>;

const CartScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { items, restaurantName, promoCode, promoDiscount } = useAppSelector((s) => s.cart);
  const [promoInput, setPromoInput] = useState('');

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.totalPrice, 0), [items]);
  const deliveryFee = 30;
  const taxes = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryFee + taxes - promoDiscount;

  const handleApplyPromo = useCallback(() => {
    if (!promoInput.trim()) return;
    // Mock promo validation
    if (promoInput.toUpperCase() === 'WELCOME50') {
      const discount = Math.min(Math.round(subtotal * 0.5), 150);
      dispatch(applyPromo({ code: promoInput.toUpperCase(), discount }));
    } else {
      Alert.alert('Invalid Code', 'This promo code is not valid.');
    }
    setPromoInput('');
  }, [promoInput, subtotal, dispatch]);

  if (items.length === 0) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
            <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Your Cart</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.emptyState}>
          <Text style={s.emptyEmoji}>🛒</Text>
          <Text style={s.emptyTitle}>Your cart is empty</Text>
          <Text style={s.emptySub}>Add items from a restaurant to get started</Text>
          <Button title="Browse Restaurants" onPress={() => navigation.goBack()}
            style={{ marginTop: Spacing.xl, width: 220 }} />
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
        <Text style={s.headerTitle} numberOfLines={1}>Order from {restaurantName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        {items.map((item) => (
          <View key={item.id} style={s.itemRow}>
            <Image source={{ uri: item.imageUrl }} style={s.itemImg} />
            <View style={s.itemInfo}>
              <Text style={s.itemName}>{item.name}</Text>
              {item.customizations.length > 0 && (
                <Text style={s.itemCustom}>{item.customizations.map((c) => c.optionName).join(', ')}</Text>
              )}
              <Text style={s.itemPrice}>{formatCurrency(item.totalPrice)}</Text>
            </View>
            <View style={s.qtyControls}>
              <TouchableOpacity style={s.qtyBtn}
                onPress={() => dispatch(updateItemQuantity({ cartItemId: item.id, quantity: item.quantity - 1 }))}>
                <Icon name="minus" size={16} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={s.qtyText}>{item.quantity}</Text>
              <TouchableOpacity style={s.qtyBtn}
                onPress={() => dispatch(updateItemQuantity({ cartItemId: item.id, quantity: item.quantity + 1 }))}>
                <Icon name="plus" size={16} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Promo Code */}
        <View style={s.promoSection}>
          <View style={s.promoRow}>
            <TextInput style={s.promoInput} placeholder="Enter promo code"
              placeholderTextColor={Colors.textDisabled} value={promoInput}
              onChangeText={setPromoInput} autoCapitalize="characters" />
            <TouchableOpacity style={s.promoApply} onPress={handleApplyPromo}>
              <Text style={s.promoApplyText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {promoCode && (
            <View style={s.promoApplied}>
              <Icon name="tag" size={16} color={Colors.primary} />
              <Text style={s.promoAppliedText}>{promoCode} — {formatCurrency(promoDiscount)} off</Text>
              <TouchableOpacity onPress={() => dispatch(removePromo())}>
                <Icon name="close-circle" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Price Breakdown */}
        <View style={s.priceSection}>
          <View style={s.priceRow}><Text style={s.priceLabel}>Subtotal</Text><Text style={s.priceValue}>{formatCurrency(subtotal)}</Text></View>
          <View style={s.priceRow}><Text style={s.priceLabel}>Delivery Fee</Text><Text style={s.priceValue}>{formatCurrency(deliveryFee)}</Text></View>
          <View style={s.priceRow}><Text style={s.priceLabel}>Taxes (5%)</Text><Text style={s.priceValue}>{formatCurrency(taxes)}</Text></View>
          {promoDiscount > 0 && (
            <View style={s.priceRow}><Text style={[s.priceLabel, { color: Colors.primary }]}>Discount</Text><Text style={[s.priceValue, { color: Colors.primary }]}>-{formatCurrency(promoDiscount)}</Text></View>
          )}
          <View style={s.divider} />
          <View style={s.priceRow}><Text style={s.totalLabel}>Total</Text><Text style={s.totalValue}>{formatCurrency(total)}</Text></View>
        </View>

        {/* Estimated Delivery */}
        <View style={s.etaRow}>
          <Icon name="clock-outline" size={18} color={Colors.textSecondary} />
          <Text style={s.etaText}>Estimated delivery: 25–35 mins</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Checkout Button */}
      <View style={s.bottomBar}>
        <Button title={`Checkout — ${formatCurrency(total)}`}
          onPress={() => navigation.navigate('Checkout')} />
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: Spacing.xxl, paddingBottom: Spacing.md },
  back: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { ...Typography.bodyLarge, color: Colors.textPrimary, fontWeight: '700', flex: 1, textAlign: 'center' },
  scroll: { flex: 1 },
  itemRow: { flexDirection: 'row', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider, gap: Spacing.md },
  itemImg: { width: 60, height: 60, borderRadius: BorderRadius.sm },
  itemInfo: { flex: 1 },
  itemName: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  itemCustom: { ...Typography.small, color: Colors.textSecondary, marginTop: 2 },
  itemPrice: { ...Typography.body, color: Colors.textPrimary, fontWeight: '700', marginTop: 4 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface2, justifyContent: 'center', alignItems: 'center' },
  qtyText: { ...Typography.bodyLarge, color: Colors.textPrimary, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  promoSection: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  promoRow: { flexDirection: 'row', gap: Spacing.sm },
  promoInput: { flex: 1, height: 44, backgroundColor: Colors.surface2, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, ...Typography.body, color: Colors.textPrimary },
  promoApply: { height: 44, paddingHorizontal: Spacing.lg, backgroundColor: Colors.surface2, borderRadius: BorderRadius.sm, justifyContent: 'center' },
  promoApplyText: { ...Typography.body, color: Colors.primary, fontWeight: '700' },
  promoApplied: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm, paddingVertical: Spacing.sm },
  promoAppliedText: { ...Typography.small, color: Colors.primary, fontWeight: '600', flex: 1 },
  priceSection: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  priceLabel: { ...Typography.body, color: Colors.textSecondary },
  priceValue: { ...Typography.body, color: Colors.textPrimary, fontWeight: '500' },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.sm },
  totalLabel: { ...Typography.h2, color: Colors.textPrimary },
  totalValue: { ...Typography.h2, color: Colors.textPrimary },
  etaRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.sm, paddingVertical: Spacing.md },
  etaText: { ...Typography.body, color: Colors.textSecondary },
  bottomBar: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl, paddingTop: Spacing.md, backgroundColor: Colors.background },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h2, color: Colors.textPrimary },
  emptySub: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.sm },
});

export default CartScreen;
