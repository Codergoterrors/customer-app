// Notifications Screen
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { markAsRead } from '../../store/slices/notificationSlice';
import type { AppNotification } from '../../types';

const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: '1', title: 'Order Delivered!', body: 'Your order from The Burger Joint has been delivered. Enjoy!', type: 'order', isRead: false, iconType: 'order', createdAt: Date.now() - 1800000 },
  { id: '2', title: '50% OFF this weekend!', body: 'Use code WEEKEND50 for 50% off on your next order.', type: 'promo', isRead: false, iconType: 'promo', createdAt: Date.now() - 7200000 },
  { id: '3', title: 'Order Confirmed', body: 'Pizza Paradise has confirmed your order. Preparing now!', type: 'order', isRead: true, iconType: 'order', createdAt: Date.now() - 86400000 },
  { id: '4', title: 'Free Delivery!', body: 'Free delivery on all orders above ₹299. Limited time!', type: 'promo', isRead: true, iconType: 'promo', createdAt: Date.now() - 172800000 },
];

const getIconConfig = (type: string) => {
  switch (type) {
    case 'order': return { name: 'shopping', bg: Colors.primary + '20', color: Colors.primary };
    case 'promo': return { name: 'tag', bg: Colors.starYellow + '20', color: Colors.starYellow };
    default: return { name: 'information', bg: Colors.info + '20', color: Colors.info };
  }
};

const getTimeLabel = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const hours = diff / 3600000;
  if (hours < 24) return 'Today';
  if (hours < 48) return 'Yesterday';
  return 'Earlier';
};

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const grouped = useMemo(() => {
    const groups: Record<string, AppNotification[]> = {};
    MOCK_NOTIFICATIONS.forEach((n) => {
      const label = getTimeLabel(n.createdAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(n);
    });
    return Object.entries(groups);
  }, []);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {grouped.map(([label, notifications]) => (
          <View key={label}>
            <Text style={s.groupLabel}>{label}</Text>
            {notifications.map((notif) => {
              const iconCfg = getIconConfig(notif.type);
              return (
                <TouchableOpacity key={notif.id} style={s.notifRow}
                  onPress={() => dispatch(markAsRead(notif.id))} activeOpacity={0.7}>
                  {!notif.isRead && <View style={s.unreadDot} />}
                  <View style={[s.notifIcon, { backgroundColor: iconCfg.bg }]}>
                    <Icon name={iconCfg.name} size={18} color={iconCfg.color} />
                  </View>
                  <View style={s.notifContent}>
                    <Text style={[s.notifTitle, !notif.isRead && s.notifTitleBold]}>{notif.title}</Text>
                    <Text style={s.notifBody} numberOfLines={2}>{notif.body}</Text>
                  </View>
                  <Text style={s.notifTime}>{formatTime(notif.createdAt)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: Spacing.xxl, paddingBottom: Spacing.md },
  back: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { ...Typography.h2, color: Colors.textPrimary },
  scrollContent: { paddingHorizontal: Spacing.xl },
  groupLabel: { ...Typography.label, color: Colors.textSecondary, marginTop: Spacing.xl, marginBottom: Spacing.md },
  notifRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider, gap: Spacing.md, position: 'relative' },
  unreadDot: { position: 'absolute', left: -8, width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  notifIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  notifContent: { flex: 1 },
  notifTitle: { ...Typography.body, color: Colors.textPrimary },
  notifTitleBold: { fontWeight: '700' },
  notifBody: { ...Typography.small, color: Colors.textSecondary, marginTop: 2 },
  notifTime: { ...Typography.caption, color: Colors.textDisabled },
});

export default NotificationsScreen;
