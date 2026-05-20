// Addresses Screen
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { Button } from '../../components';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateUserProfile } from '../../store/slices/authSlice';
import type { SavedAddress } from '../../types';

const MOCK_ADDRESSES: SavedAddress[] = [
  { id: '1', label: 'Home', fullAddress: 'Koregaon Park, Pune, Maharashtra 411001', lat: 18.5362, lng: 73.8929, isDefault: true },
  { id: '2', label: 'Work', fullAddress: '42 MG Road, Camp, Pune, Maharashtra 411001', lat: 18.5204, lng: 73.8567, isDefault: false },
];

const AddressesScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete Address', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {} },
    ]);
  }, []);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Addresses</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {MOCK_ADDRESSES.map((addr) => (
          <View key={addr.id} style={s.addressCard}>
            <View style={s.iconCol}>
              <Icon name={addr.label === 'Home' ? 'home' : 'briefcase'} size={22} color={Colors.primary} />
            </View>
            <View style={s.addressInfo}>
              <View style={s.labelRow}>
                <Text style={s.label}>{addr.label}</Text>
                {addr.isDefault && (
                  <View style={s.defaultBadge}>
                    <Text style={s.defaultText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={s.fullAddress} numberOfLines={2}>{addr.fullAddress}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(addr.id)} style={s.deleteBtn}>
              <Icon name="delete-outline" size={20} color={Colors.textDisabled} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={s.bottomBar}>
        <Button title="Add New Address" onPress={() => {}}
          icon={<Icon name="plus" size={20} color={Colors.textInverse} />} />
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: Spacing.xxl, paddingBottom: Spacing.md },
  back: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { ...Typography.h2, color: Colors.textPrimary },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  addressCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md, gap: Spacing.md,
  },
  iconCol: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  addressInfo: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  label: { ...Typography.body, color: Colors.textPrimary, fontWeight: '700' },
  defaultBadge: { backgroundColor: Colors.primary + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  defaultText: { fontSize: 10, color: Colors.primary, fontWeight: '700' },
  fullAddress: { ...Typography.small, color: Colors.textSecondary, marginTop: 4 },
  deleteBtn: { padding: Spacing.sm },
  bottomBar: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, paddingTop: Spacing.md },
});

export default AddressesScreen;
