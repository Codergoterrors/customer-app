// Checkout Screen — Real order creation via Firestore
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { Button } from '../../components';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { clearCart } from '../../store/slices/cartSlice';
import { setActiveOrder } from '../../store/slices/orderSlice';
import { orderService } from '../../services';
import { formatCurrency } from '../../utils';
import type { HomeStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Checkout'>;

const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const cart = useAppSelector((s) => s.cart);
  const currentAddress = useAppSelector((s) => s.location.currentAddress);
  const user = useAppSelector((s) => s.auth.user);

  const [deliveryTime, setDeliveryTime] = useState<'asap' | 'scheduled'>('asap');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [instructions, setInstructions] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);

  const subtotal = useMemo(() => cart.items.reduce((s, i) => s + i.totalPrice, 0), [cart.items]);
  const deliveryFee = 30;
  const taxes = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryFee + taxes - cart.promoDiscount;

  const handlePlaceOrder = useCallback(async () => {
    // Validate address
    if (!currentAddress) {
      Alert.alert('Set Address', 'Please set a delivery address before placing your order.');
      return;
    }
    if (!user?.uid) {
      Alert.alert('Login Required', 'Please login to place an order.');
      return;
    }

    setIsPlacing(true);
    try {
      // Create real order in Firestore
      const orderId = await orderService.createOrder({
        customerId: user.uid,
        restaurantId: cart.restaurantId || '',
        restaurantName: cart.restaurantName || '',
        restaurantImage: '',
        items: cart.items.map((i) => ({
          itemId: i.itemId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          customizations: i.customizations,
          specialInstructions: instructions || undefined,
        })),
        pricing: { subtotal, deliveryFee, taxes, discount: cart.promoDiscount, total },
        deliveryAddress: {
          fullAddress: currentAddress.fullAddress,
          lat: currentAddress.lat,
          lng: currentAddress.lng,
          flatNo: currentAddress.flatNo,
          landmark: currentAddress.landmark,
        },
        paymentMethod: {
          type: paymentMethod as any,
          label: paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'card' ? 'Card' : 'Wallet',
        },
        estimatedDeliveryTime: 30,
      });

      // Fetch the created order to store locally
      const createdOrder = await orderService.getOrder(orderId);
      if (createdOrder) {
        dispatch(setActiveOrder(createdOrder));
      }

      dispatch(clearCart());
      setIsPlacing(false);
      navigation.navigate('OrderPlaced', { orderId });
    } catch (error: any) {
      setIsPlacing(false);
      Alert.alert('Order Failed', error.message || 'Failed to place order. Please try again.');
    }
  }, [dispatch, cart, user, currentAddress, subtotal, deliveryFee, taxes, total, paymentMethod, instructions, navigation]);

  const payments = [
    { id: 'upi', label: 'UPI', icon: 'cellphone' },
    { id: 'card', label: 'Card', icon: 'credit-card' },
    { id: 'wallet', label: 'Wallet', icon: 'wallet' },
  ];

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Delivery Address */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Deliver to</Text>
          <View style={s.addressCard}>
            <Icon name="map-marker" size={20} color={Colors.primary} />
            <View style={s.addressInfo}>
              <Text style={s.addressLabel}>{currentAddress?.label || 'Home'}</Text>
              <Text style={s.addressText}>{currentAddress?.fullAddress || 'Set your address'}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('AddAddress')}>
              <Text style={s.changeLink}>Change</Text>
            </TouchableOpacity>
          </View>
          <TextInput style={s.instructionInput} placeholder="Add instructions for rider..."
            placeholderTextColor={Colors.textDisabled} value={instructions}
            onChangeText={setInstructions} multiline />
        </View>

        {/* Delivery Time */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Delivery Time</Text>
          {(['asap', 'scheduled'] as const).map((opt) => (
            <TouchableOpacity key={opt} style={s.radioRow} onPress={() => setDeliveryTime(opt)}>
              <View style={[s.radio, deliveryTime === opt && s.radioActive]}>
                {deliveryTime === opt && <View style={s.radioDot} />}
              </View>
              <Text style={s.radioLabel}>
                {opt === 'asap' ? 'ASAP (25–35 min)' : 'Schedule for later'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Payment</Text>
          {payments.map((pm) => (
            <TouchableOpacity key={pm.id} style={[s.paymentRow, paymentMethod === pm.id && s.paymentRowActive]}
              onPress={() => setPaymentMethod(pm.id)}>
              <View style={[s.radio, paymentMethod === pm.id && s.radioActive]}>
                {paymentMethod === pm.id && <View style={s.radioDot} />}
              </View>
              <Icon name={pm.icon} size={20} color={Colors.textSecondary} />
              <Text style={s.paymentLabel}>{pm.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Order Summary */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Order Summary</Text>
          {cart.items.map((item) => (
            <View key={item.id} style={s.summaryRow}>
              <Text style={s.summaryQty}>{item.quantity}×</Text>
              <Text style={s.summaryName}>{item.name}</Text>
              <Text style={s.summaryPrice}>{formatCurrency(item.totalPrice)}</Text>
            </View>
          ))}
          <View style={s.divider} />
          <View style={s.priceRow}><Text style={s.priceLabel}>Subtotal</Text><Text style={s.priceVal}>{formatCurrency(subtotal)}</Text></View>
          <View style={s.priceRow}><Text style={s.priceLabel}>Delivery</Text><Text style={s.priceVal}>{formatCurrency(deliveryFee)}</Text></View>
          <View style={s.priceRow}><Text style={s.priceLabel}>Taxes</Text><Text style={s.priceVal}>{formatCurrency(taxes)}</Text></View>
          {cart.promoDiscount > 0 && (
            <View style={s.priceRow}><Text style={[s.priceLabel, { color: Colors.primary }]}>Discount</Text><Text style={[s.priceVal, { color: Colors.primary }]}>-{formatCurrency(cart.promoDiscount)}</Text></View>
          )}
          <View style={s.divider} />
          <View style={s.priceRow}><Text style={s.totalLabel}>Total</Text><Text style={s.totalVal}>{formatCurrency(total)}</Text></View>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={s.bottomBar}>
        <Button title={`Place Order — ${formatCurrency(total)}`}
          onPress={handlePlaceOrder} loading={isPlacing} />
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: Spacing.xxl, paddingBottom: Spacing.md },
  back: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { ...Typography.h2, color: Colors.textPrimary },
  scroll: { flex: 1 },
  section: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  sectionTitle: { ...Typography.bodyLarge, color: Colors.textPrimary, fontWeight: '700', marginBottom: Spacing.md },
  addressCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md },
  addressInfo: { flex: 1 },
  addressLabel: { ...Typography.body, color: Colors.textPrimary, fontWeight: '700' },
  addressText: { ...Typography.small, color: Colors.textSecondary, marginTop: 2 },
  changeLink: { ...Typography.body, color: Colors.primary, fontWeight: '600' },
  instructionInput: { height: 48, backgroundColor: Colors.surface2, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, marginTop: Spacing.md, ...Typography.body, color: Colors.textPrimary },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.textDisabled, justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  radioLabel: { ...Typography.body, color: Colors.textPrimary },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.sm, marginBottom: Spacing.xs },
  paymentRowActive: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.primary },
  paymentLabel: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: Spacing.sm },
  summaryQty: { ...Typography.body, color: Colors.textSecondary, width: 24 },
  summaryName: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  summaryPrice: { ...Typography.body, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.sm },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  priceLabel: { ...Typography.body, color: Colors.textSecondary },
  priceVal: { ...Typography.body, color: Colors.textPrimary },
  totalLabel: { ...Typography.h3, color: Colors.textPrimary },
  totalVal: { ...Typography.h3, color: Colors.textPrimary },
  bottomBar: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl, paddingTop: Spacing.md },
});

export default CheckoutScreen;
