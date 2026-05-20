// Cancel Order Screen — Uber style with theme support
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, Animated, Dimensions, StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppDispatch } from '../../store/hooks';
import { clearActiveOrder } from '../../store/slices/orderSlice';
import { orderService } from '../../services';
import { useTheme } from '../../theme/ThemeContext';
import type { HomeStackParamList } from '../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<HomeStackParamList, 'CancelOrder'>;
type CancelRoute = RouteProp<HomeStackParamList, 'CancelOrder'>;

const CANCEL_REASONS = [
  { id: 'wait', label: 'Wait time is too long' },
  { id: 'mistake', label: 'Placed order by mistake' },
  { id: 'change_items', label: 'Want to change items' },
  { id: 'change_address', label: 'Want to change delivery address' },
  { id: 'change_restaurant', label: 'Want to order from another restaurant' },
  { id: 'duplicate', label: 'Duplicate order' },
  { id: 'other', label: 'Other' },
];

const CancelOrderScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<CancelRoute>();
  const { orderId } = route.params;
  const dispatch = useAppDispatch();

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showConfirmation) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 20, stiffness: 120, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [showConfirmation]);

  const handleCancel = useCallback(async () => {
    setIsCancelling(true);
    try {
      await orderService.cancelOrder(orderId);
      dispatch(clearActiveOrder());
      setIsCancelling(false);
      setIsCancelled(true);
      Animated.spring(checkScale, {
        toValue: 1, damping: 10, stiffness: 150, useNativeDriver: true,
      }).start();
      setTimeout(() => {
        setShowConfirmation(false);
        navigation.popToTop();
      }, 1800);
    } catch (_error) {
      setIsCancelling(false);
    }
  }, [orderId, dispatch, navigation, checkScale]);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={s.header}>
        <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
          <Icon name="close" size={24} color={colors.closeIconColor} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Cancel order</Text>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>What's the reason for cancelling?</Text>

        {CANCEL_REASONS.map((reason) => {
          const isSelected = selectedReason === reason.id;
          return (
            <TouchableOpacity
              key={reason.id}
              style={[s.reasonRow, { borderBottomColor: colors.divider }]}
              onPress={() => setSelectedReason(reason.id)}
              activeOpacity={0.5}>
              <View style={[s.radio, { borderColor: colors.radioBorder }, isSelected && { borderColor: colors.radioSelected }]}>
                {isSelected && <View style={[s.radioDot, { backgroundColor: colors.radioDot }]} />}
              </View>
              <Text style={[s.reasonText, { color: colors.textPrimary }]}>{reason.label}</Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[s.bottomBar, { borderTopColor: colors.divider, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[
            s.cancelBtn,
            { backgroundColor: colors.cancelBtnBg },
            !selectedReason && { backgroundColor: colors.cancelBtnDisabledBg },
          ]}
          onPress={() => selectedReason && setShowConfirmation(true)}
          disabled={!selectedReason}
          activeOpacity={0.8}>
          <Text style={[
            s.cancelBtnText,
            { color: colors.cancelBtnText },
            !selectedReason && { color: colors.cancelBtnDisabledText },
          ]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal */}
      <Modal transparent visible={showConfirmation} animationType="none">
        <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => !isCancelling && !isCancelled && setShowConfirmation(false)}
          />
          <Animated.View style={[s.confirmSheet, { backgroundColor: colors.confirmSheetBg, transform: [{ translateY: slideAnim }] }]}>
            {isCancelled ? (
              <View style={s.successContainer}>
                <Animated.View style={[s.successIcon, { transform: [{ scale: checkScale }] }]}>
                  <View style={s.successCircle}>
                    <Icon name="check" size={36} color="#FFF" />
                  </View>
                </Animated.View>
                <Text style={[s.confirmTitle, { color: colors.textPrimary }]}>Order cancelled</Text>
                <Text style={[s.confirmSub, { color: colors.textSecondary }]}>Your order has been cancelled successfully.</Text>
              </View>
            ) : (
              <>
                <View style={s.confirmIconWrap}>
                  <View style={s.confirmIconCircle}>
                    <Icon name="cancel" size={32} color="#FFF" />
                  </View>
                </View>
                <Text style={[s.confirmTitle, { color: colors.textPrimary }]}>Cancel this order?</Text>
                <Text style={[s.confirmSub, { color: colors.textSecondary }]}>
                  This action cannot be undone. You may be charged a cancellation fee if the restaurant has already started preparing.
                </Text>
                <TouchableOpacity style={s.yesCancelBtn} onPress={handleCancel} disabled={isCancelling} activeOpacity={0.8}>
                  <Text style={s.yesCancelText}>{isCancelling ? 'Cancelling...' : 'Yes, cancel'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.goBackBtn, { backgroundColor: colors.goBackBtnBg }]}
                  onPress={() => setShowConfirmation(false)}
                  disabled={isCancelling}
                  activeOpacity={0.8}>
                  <Text style={[s.goBackText, { color: colors.goBackBtnText }]}>No, go back</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 8 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700', paddingHorizontal: 20, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, paddingHorizontal: 20, marginTop: 6, marginBottom: 24 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20, gap: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioDot: { width: 14, height: 14, borderRadius: 7 },
  reasonText: { fontSize: 16, fontWeight: '500', flex: 1 },
  bottomBar: { paddingHorizontal: 20, paddingBottom: 34, paddingTop: 12, borderTopWidth: 1 },
  cancelBtn: { height: 52, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { fontSize: 16, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  confirmSheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 },
  confirmIconWrap: { alignItems: 'center', marginBottom: 20 },
  confirmIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E53935', justifyContent: 'center', alignItems: 'center' },
  confirmTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  confirmSub: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  yesCancelBtn: { height: 52, borderRadius: 8, backgroundColor: '#E53935', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  yesCancelText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  goBackBtn: { height: 52, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  goBackText: { fontSize: 16, fontWeight: '700' },
  successContainer: { alignItems: 'center', paddingVertical: 20 },
  successIcon: { marginBottom: 16 },
  successCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#06C167', justifyContent: 'center', alignItems: 'center' },
});

export default CancelOrderScreen;
