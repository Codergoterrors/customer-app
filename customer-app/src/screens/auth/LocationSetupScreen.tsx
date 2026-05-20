// Location Setup Screen
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { Button, Input } from '../../components';
import { useAppDispatch } from '../../store/hooks';
import { setCurrentAddress, setCurrentCoordinates, setLocationPermission } from '../../store/slices/locationSlice';
import type { SavedAddress } from '../../types';

const LocationSetupScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUseCurrentLocation = useCallback(async () => {
    setIsLoading(true);
    try {
      // In production, use Geolocation API
      const mockAddress: SavedAddress = {
        id: 'default',
        label: 'Home',
        fullAddress: 'Koregaon Park, Pune, Maharashtra 411001',
        lat: 18.5362,
        lng: 73.8929,
        isDefault: true,
      };
      dispatch(setCurrentAddress(mockAddress));
      dispatch(setCurrentCoordinates({ lat: 18.5362, lng: 73.8929 }));
      dispatch(setLocationPermission(true));
    } catch (error) {
      Alert.alert('Location Error', 'Unable to get your location. Please enter manually.');
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  const handleManualAddress = useCallback(() => {
    if (!address.trim()) {
      Alert.alert('Enter Address', 'Please enter your delivery address.');
      return;
    }
    const manualAddress: SavedAddress = {
      id: 'manual_1',
      label: 'Home',
      fullAddress: address,
      lat: 18.5204,
      lng: 73.8567,
      isDefault: true,
    };
    dispatch(setCurrentAddress(manualAddress));
    dispatch(setLocationPermission(true));
  }, [address, dispatch]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Where do you want{'\n'}your food delivered?</Text>
      <Text style={styles.subtitle}>We need your location to show nearby restaurants</Text>

      {/* Map placeholder */}
      <View style={styles.mapPlaceholder}>
        <Icon name="map-marker" size={48} color={Colors.primary} />
        <Text style={styles.mapText}>Map View</Text>
      </View>

      {/* Search input */}
      <Input
        placeholder="Search for your address"
        leftIcon="magnify"
        value={address}
        onChangeText={setAddress}
        containerStyle={{ marginBottom: Spacing.lg }}
      />

      <Button
        title="Use current location"
        onPress={handleUseCurrentLocation}
        loading={isLoading}
        icon={<Icon name="crosshairs-gps" size={20} color={Colors.textInverse} />}
      />

      <View style={{ height: Spacing.md }} />

      <Button
        title="Enter address manually"
        variant="ghost"
        onPress={handleManualAddress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.xl },
  header: { paddingTop: Spacing.xxl, paddingBottom: Spacing.base },
  back: { width: 40, height: 40, justifyContent: 'center' },
  title: { ...Typography.h1, color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xl },
  mapPlaceholder: {
    height: 200, backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl,
  },
  mapText: { ...Typography.small, color: Colors.textDisabled, marginTop: Spacing.sm },
});

export default LocationSetupScreen;
