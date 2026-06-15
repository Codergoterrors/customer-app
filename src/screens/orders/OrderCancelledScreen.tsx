// OrderCancelledScreen — shown when driver or system cancels an order
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, StatusBar, Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/ThemeContext';
import type { HomeStackParamList } from '../../types';

const { width } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<HomeStackParamList, 'OrderCancelled'>;
type Route = RouteProp<HomeStackParamList, 'OrderCancelled'>;

const OrderCancelledScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { cancelledBy, cancelReason, orderId } = route.params;

  const iconScale = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(iconScale, { toValue: 1, damping: 12, stiffness: 120, useNativeDriver: true }),
        Animated.timing(iconOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const isCancelledByRider = cancelledBy === 'rider';

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Icon */}
      <Animated.View style={[s.iconWrap, { opacity: iconOpacity, transform: [{ scale: iconScale }] }]}>
        <View style={s.iconCircle}>
          <Icon name="close-circle" size={64} color="#FF3B30" />
        </View>
      </Animated.View>

      {/* Text */}
      <Animated.View style={[s.textWrap, { opacity: textOpacity }]}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Order Cancelled</Text>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>
          {isCancelledByRider
            ? 'Your delivery partner had to cancel this order.'
            : 'This order has been cancelled.'}
        </Text>

        {/* Reason card */}
        {cancelReason ? (
          <View style={[s.reasonCard, { backgroundColor: colors.surface, borderColor: '#FF3B3030' }]}>
            <View style={s.reasonHeader}>
              <Icon name="information-outline" size={18} color="#FF3B30" />
              <Text style={[s.reasonLabel, { color: colors.textSecondary }]}>
                {isCancelledByRider ? 'Reason from delivery partner' : 'Cancellation reason'}
              </Text>
            </View>
            <Text style={[s.reasonText, { color: colors.textPrimary }]}>{cancelReason}</Text>
          </View>
        ) : null}

        {/* Info */}
        <View style={[s.infoCard, { backgroundColor: colors.surface }]}>
          <Icon name="cash-refund" size={20} color="#34C759" style={s.infoIcon} />
          <Text style={[s.infoText, { color: colors.textSecondary }]}>
            If you were charged, a full refund will be processed within 3–5 business days.
          </Text>
        </View>
      </Animated.View>

      {/* Actions */}
      <View style={s.actions}>
        <TouchableOpacity
          style={[s.primaryBtn, { backgroundColor: colors.primary || '#FF3B30' }]}
          onPress={() => navigation.popToTop()}
          activeOpacity={0.85}
        >
          <Text style={s.primaryBtnText}>Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.secondaryBtn, { borderColor: colors.border }]}
          onPress={() => navigation.popToTop()}
          activeOpacity={0.7}
        >
          <Text style={[s.secondaryBtnText, { color: colors.textSecondary }]}>Order from another restaurant</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  iconWrap: { marginBottom: 28 },
  iconCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#FF3B3015',
    justifyContent: 'center', alignItems: 'center',
  },
  textWrap: { width: '100%', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 16 },
  reasonCard: {
    width: '100%', borderRadius: 14, padding: 16,
    borderWidth: 1, marginBottom: 16,
  },
  reasonHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reasonLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 6 },
  reasonText: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  infoCard: {
    width: '100%', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'flex-start', marginBottom: 32,
  },
  infoIcon: { marginRight: 12, marginTop: 2 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },
  actions: { width: '100%', gap: 12 },
  primaryBtn: {
    height: 54, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    height: 54, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600' },
});

export default OrderCancelledScreen;
