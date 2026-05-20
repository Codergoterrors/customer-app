// Select Address Bottom Sheet — Shows saved addresses + add new option
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setCurrentAddress } from '../../store/slices/locationSlice';
import { addressService } from '../../services/addressService';
import type { SavedAddress } from '../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  onAddNew: () => void;
}

const SelectAddressSheet: React.FC<Props> = ({ visible, onClose, onAddNew }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const currentAddress = useAppSelector((s) => s.location.currentAddress);

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const slideAnim = useState(new Animated.Value(SCREEN_HEIGHT))[0];

  useEffect(() => {
    if (visible && user?.uid) {
      setIsLoading(true);
      addressService.getAddresses(user.uid).then((addrs) => {
        setAddresses(addrs);
        setIsLoading(false);
      });
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 20,
        stiffness: 120,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, user?.uid]);

  const handleSelectAddress = useCallback(
    (address: SavedAddress) => {
      dispatch(setCurrentAddress(address));
      onClose();
    },
    [dispatch, onClose],
  );

  const handleDeleteAddress = useCallback(
    async (addressId: string) => {
      if (!user?.uid) return;
      try {
        await addressService.deleteAddress(user.uid, addressId);
        setAddresses((prev) => prev.filter((a) => a.id !== addressId));
      } catch (error) {
        console.error('Failed to delete address:', error);
      }
    },
    [user?.uid],
  );

  const getIcon = (label: string) => {
    switch (label) {
      case 'Home':
        return 'home';
      case 'Work':
        return 'briefcase';
      default:
        return 'map-marker';
    }
  };

  const renderAddress = ({ item }: { item: SavedAddress }) => (
    <TouchableOpacity
      style={[
        s.addressItem,
        currentAddress?.id === item.id && s.addressItemActive,
      ]}
      onPress={() => handleSelectAddress(item)}>
      <View style={s.iconContainer}>
        <Icon
          name={getIcon(item.label)}
          size={20}
          color={currentAddress?.id === item.id ? Colors.primary : Colors.textSecondary}
        />
      </View>
      <View style={s.addressDetails}>
        <Text style={s.addressLabel}>{item.label}</Text>
        <Text style={s.addressText} numberOfLines={2}>
          {item.fullAddress}
        </Text>
      </View>
      {currentAddress?.id === item.id ? (
        <Icon name="check-circle" size={22} color={Colors.primary} />
      ) : (
        <TouchableOpacity
          onPress={() => handleDeleteAddress(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="delete-outline" size={20} color={Colors.textDisabled} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <Animated.View
          style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity activeOpacity={1}>
            <View style={s.handle} />
            <Text style={s.title}>Select delivery address</Text>

            {isLoading ? (
              <View style={s.loadingContainer}>
                <Text style={s.loadingText}>Loading addresses...</Text>
              </View>
            ) : addresses.length === 0 ? (
              <View style={s.emptyContainer}>
                <Icon name="map-marker-plus-outline" size={48} color={Colors.textDisabled} />
                <Text style={s.emptyTitle}>No saved addresses</Text>
                <Text style={s.emptySubtext}>
                  Add your first delivery address
                </Text>
              </View>
            ) : (
              <FlatList
                data={addresses}
                keyExtractor={(item) => item.id}
                renderItem={renderAddress}
                style={s.list}
                showsVerticalScrollIndicator={false}
              />
            )}

            <TouchableOpacity
              style={s.addNewBtn}
              onPress={() => {
                onClose();
                onAddNew();
              }}>
              <Icon name="plus-circle" size={22} color={Colors.primary} />
              <Text style={s.addNewText}>Add New Address</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    maxHeight: SCREEN_HEIGHT * 0.65,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.surface2,
    borderRadius: 999,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  list: {
    maxHeight: SCREEN_HEIGHT * 0.35,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    gap: Spacing.md,
  },
  addressItemActive: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressDetails: {
    flex: 1,
  },
  addressLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  addressText: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  addNewText: {
    ...Typography.bodyLarge,
    color: Colors.primary,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});

export default SelectAddressSheet;
