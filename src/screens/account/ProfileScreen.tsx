// Profile Screen — with theme toggle
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Typography, Spacing } from '../../constants';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { useTheme } from '../../theme/ThemeContext';
import type { AccountStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<AccountStackParamList, 'Profile'>;

const ProfileScreen: React.FC = () => {
  const { colors, isDark, toggleTheme } = useTheme();
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const handleLogout = useCallback(() => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  }, [dispatch]);

  const menuItems = [
    { icon: 'home-outline', label: 'My Addresses', screen: 'Addresses' as const },
    { icon: 'credit-card-outline', label: 'Payment Methods', screen: null },
    { icon: 'bell-outline', label: 'Notifications', screen: 'Notifications' as const },
    { icon: 'help-circle-outline', label: 'Help & Support', screen: null },
    { icon: 'shield-lock-outline', label: 'Privacy Policy', screen: null },
    { icon: 'information-outline', label: 'App Version 1.0.0', screen: null, noArrow: true },
  ];

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar & Info */}
        <View style={s.profileSection}>
          <TouchableOpacity style={[s.avatar, { backgroundColor: colors.surface2 }]}>
            <Icon name="account" size={40} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={s.nameRow}>
            <Text style={[s.name, { color: colors.textPrimary }]}>{user?.name || 'Guest User'}</Text>
            <TouchableOpacity>
              <Icon name="pencil" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[s.email, { color: colors.textSecondary }]}>{user?.email || 'guest@foodapp.com'}</Text>
          <Text style={[s.phone, { color: colors.textSecondary }]}>{user?.phone || '+91 98765 43210'}</Text>
        </View>

        {/* Theme Toggle */}
        <View style={[s.themeSection, { backgroundColor: colors.surface }]}>
          <View style={s.themeRow}>
            <View style={s.themeLeft}>
              <Icon
                name={isDark ? 'weather-night' : 'white-balance-sunny'}
                size={22}
                color={colors.primary}
              />
              <View>
                <Text style={[s.themeLabel, { color: colors.textPrimary }]}>Dark Mode</Text>
                <Text style={[s.themeSub, { color: colors.textSecondary }]}>
                  {isDark ? 'Dark theme is on' : 'Light theme is on'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D0D0D0', true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Menu Items */}
        <View style={s.menuSection}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={[s.menuRow, { borderBottomColor: colors.divider }]}
              onPress={() => item.screen && navigation.navigate(item.screen)}
              disabled={!item.screen && !item.noArrow}>
              <Icon name={item.icon} size={22} color={colors.textSecondary} />
              <Text style={[s.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
              {!item.noArrow && (
                <Icon name="chevron-right" size={20} color={colors.textDisabled} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  profileSection: { alignItems: 'center', paddingTop: Spacing.xxxl, paddingBottom: Spacing.xl },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { ...Typography.h2 },
  email: { ...Typography.body, marginTop: 4 },
  phone: { ...Typography.body, marginTop: 2 },

  // Theme toggle
  themeSection: {
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeLabel: { fontSize: 16, fontWeight: '600' },
  themeSub: { fontSize: 12, marginTop: 1 },

  menuSection: { paddingHorizontal: Spacing.xl },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', height: 56, gap: Spacing.md,
    borderBottomWidth: 1,
  },
  menuLabel: { ...Typography.bodyLarge, flex: 1 },
  logoutBtn: { alignItems: 'center', paddingVertical: Spacing.xxl },
  logoutText: { ...Typography.bodyLarge, color: '#FF4444', fontWeight: '600' },
});

export default ProfileScreen;
