// Help Screen — Uber Eats style with theme support
import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/ThemeContext';
import type { HomeStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Help'>;
type HelpRoute = RouteProp<HomeStackParamList, 'Help'>;

interface HelpOption {
  id: string;
  title: string;
  action: 'cancel' | 'call' | 'chat' | 'faq';
}

const HELP_OPTIONS: HelpOption[] = [
  { id: 'cancel', title: 'Cancel order', action: 'cancel' },
  { id: 'wrong_items', title: 'Wrong or missing items', action: 'chat' },
  { id: 'delivery', title: 'Delivery issue', action: 'chat' },
  { id: 'payment', title: 'Payment issue', action: 'chat' },
  { id: 'call', title: 'Call support', action: 'call' },
  { id: 'faq', title: 'FAQs', action: 'faq' },
];

const HelpScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<HelpRoute>();
  const { orderId, canCancel } = route.params;

  const handleOption = useCallback((option: HelpOption) => {
    switch (option.action) {
      case 'cancel':
        if (canCancel) navigation.navigate('CancelOrder', { orderId });
        break;
      case 'call':
        Linking.openURL('tel:+918888888888');
        break;
      default:
        break;
    }
  }, [canCancel, orderId, navigation]);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={s.header}>
        <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
          <Icon name="close" size={24} color={colors.closeIconColor} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Help</Text>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>Order #{orderId.slice(-8)}</Text>

        <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>What do you need help with?</Text>

        {HELP_OPTIONS.map((option) => {
          const isDisabled = option.action === 'cancel' && !canCancel;
          return (
            <TouchableOpacity
              key={option.id}
              style={[s.optionRow, { borderBottomColor: colors.divider }, isDisabled && s.optionDisabled]}
              onPress={() => handleOption(option)}
              disabled={isDisabled}
              activeOpacity={0.5}>
              <Text style={[s.optionText, { color: colors.textPrimary }, isDisabled && { color: colors.textDisabled }]}>
                {option.title}
                {isDisabled ? ' (unavailable)' : ''}
              </Text>
              <Icon name="chevron-right" size={22} color={isDisabled ? colors.textDisabled : colors.textSecondary} />
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 8 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700', paddingHorizontal: 20, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, paddingHorizontal: 20, marginTop: 4, marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '500', paddingHorizontal: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  optionDisabled: { opacity: 0.35 },
  optionText: { fontSize: 16, fontWeight: '500', flex: 1 },
});

export default HelpScreen;
