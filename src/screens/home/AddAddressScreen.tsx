// Add Address Screen — Pin on real map → fill address details → save
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Map, Camera, Marker } from '@maplibre/maplibre-react-native';

const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm-tiles', type: 'raster', source: 'osm' }],
};
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { Button } from '../../components';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setCurrentAddress } from '../../store/slices/locationSlice';
import { addressService } from '../../services/addressService';
import type { HomeStackParamList, SavedAddress } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
type Nav = NativeStackNavigationProp<HomeStackParamList, 'AddAddress'>;

const INITIAL_REGION = {
  latitude: 18.5204,
  longitude: 73.8567,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

type AddressStep = 'map' | 'details';

const AddAddressScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const cameraRef = useRef<any>(null);

  const [step, setStep] = useState<AddressStep>('map');
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: INITIAL_REGION.latitude,
    longitude: INITIAL_REGION.longitude,
  });
  const [flatNo, setFlatNo] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [label, setLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [isSaving, setIsSaving] = useState(false);

  const handleRegionChange = useCallback((feature: any) => {
    if (feature && feature.geometry && feature.geometry.coordinates) {
      const [longitude, latitude] = feature.geometry.coordinates;
      setSelectedLocation({ latitude, longitude });
    }
  }, []);

  const handleConfirmLocation = useCallback(() => {
    setStep('details');
  }, []);

  const handleSaveAddress = useCallback(async () => {
    if (!flatNo.trim() && !buildingName.trim() && !area.trim()) {
      Alert.alert('Missing Info', 'Please fill at least flat/house no or area.');
      return;
    }
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to save an address.');
      return;
    }

    setIsSaving(true);
    try {
      const fullAddress = [flatNo, buildingName, area, landmark]
        .filter(Boolean)
        .join(', ');

      const address: SavedAddress = {
        id: `addr_${Date.now()}`,
        label,
        fullAddress,
        flatNo,
        buildingName,
        area,
        landmark,
        lat: selectedLocation.latitude,
        lng: selectedLocation.longitude,
        isDefault: true,
      };

      await addressService.saveAddress(user.uid, address);
      dispatch(setCurrentAddress(address));
      Alert.alert('Address Saved!', 'Your delivery address has been saved.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save address.');
    } finally {
      setIsSaving(false);
    }
  }, [flatNo, buildingName, area, landmark, label, selectedLocation, user, dispatch, navigation]);

  if (step === 'map') {
    return (
      <View style={s.container}>
        {/* Map */}
        <Map
          style={s.map}
          mapStyle={OSM_STYLE}
          onRegionDidChange={handleRegionChange}
          attributionEnabled={true}
          logoEnabled={false}
          compassEnabled={false}>
          <Camera
            ref={cameraRef}
            zoomLevel={15}
            centerCoordinate={[INITIAL_REGION.longitude, INITIAL_REGION.latitude]}
          />
        </Map>

        {/* Center pin (fixed overlay) */}
        <View style={s.centerPin} pointerEvents="none">
          <Icon name="map-marker" size={42} color={Colors.primary} />
        </View>

        {/* Top bar */}
        <TouchableOpacity style={s.mapBackBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color={Colors.black} />
        </TouchableOpacity>

        {/* My location button */}
        <TouchableOpacity style={s.myLocationBtn} onPress={() => {
          cameraRef.current?.setCamera({
            centerCoordinate: [INITIAL_REGION.longitude, INITIAL_REGION.latitude],
            zoomLevel: 15,
            animationDuration: 500,
          });
        }}>
          <Icon name="crosshairs-gps" size={22} color={Colors.primary} />
        </TouchableOpacity>

        {/* Bottom confirm card */}
        <View style={s.bottomCard}>
          <Text style={s.cardTitle}>Set delivery location</Text>
          <Text style={s.coordText}>
            {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
          </Text>
          <Button title="Confirm Location" onPress={handleConfirmLocation} />
        </View>
      </View>
    );
  }

  // Step 2: Address details form
  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.detailsHeader}>
        <TouchableOpacity onPress={() => setStep('map')} style={s.detailsBackBtn}>
          <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.detailsTitle}>Complete Address</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.form}
        contentContainerStyle={s.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Mini map preview */}
        <View style={s.miniMapWrapper}>
          <Map
            style={s.miniMap}
            mapStyle={OSM_STYLE}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            attributionEnabled={false}
            logoEnabled={false}>
            <Camera
              zoomLevel={15}
              centerCoordinate={[selectedLocation.longitude, selectedLocation.latitude]}
            />
            <Marker
              id="selected-marker"
              coordinate={[selectedLocation.longitude, selectedLocation.latitude]}>
              <Icon name="map-marker" size={32} color={Colors.primary} />
            </Marker>
          </Map>
          <TouchableOpacity style={s.changeLocationBtn} onPress={() => setStep('map')}>
            <Text style={s.changeLocationText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Address fields */}
        <Text style={s.fieldLabel}>Flat / House No. *</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. Flat 301, B Wing"
          placeholderTextColor={Colors.textDisabled}
          value={flatNo}
          onChangeText={setFlatNo}
        />

        <Text style={s.fieldLabel}>Building / Society Name</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. Green Valley Apartments"
          placeholderTextColor={Colors.textDisabled}
          value={buildingName}
          onChangeText={setBuildingName}
        />

        <Text style={s.fieldLabel}>Area / Locality *</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. Koregaon Park"
          placeholderTextColor={Colors.textDisabled}
          value={area}
          onChangeText={setArea}
        />

        <Text style={s.fieldLabel}>Landmark (optional)</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. Near Phoenix Mall"
          placeholderTextColor={Colors.textDisabled}
          value={landmark}
          onChangeText={setLandmark}
        />

        {/* Label selection */}
        <Text style={s.fieldLabel}>Save as</Text>
        <View style={s.labelRow}>
          {(['Home', 'Work', 'Other'] as const).map((l) => (
            <TouchableOpacity
              key={l}
              style={[s.labelChip, label === l && s.labelChipActive]}
              onPress={() => setLabel(l)}>
              <Icon
                name={l === 'Home' ? 'home' : l === 'Work' ? 'briefcase' : 'map-marker'}
                size={16}
                color={label === l ? Colors.white : Colors.textSecondary}
              />
              <Text style={[s.labelChipText, label === l && s.labelChipTextActive]}>
                {l}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: Spacing.xl }} />
        <Button title="Save Address" onPress={handleSaveAddress} loading={isSaving} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  map: { flex: 1 },
  centerPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -21,
    marginTop: -42,
    zIndex: 10,
  },
  mapBackBtn: {
    position: 'absolute',
    top: Spacing.xxl,
    left: Spacing.base,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  myLocationBtn: {
    position: 'absolute',
    bottom: 180,
    right: Spacing.base,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  coordText: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  // Details step
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.md,
  },
  detailsBackBtn: { width: 40, height: 40, justifyContent: 'center' },
  detailsTitle: { ...Typography.h2, color: Colors.textPrimary },
  form: { flex: 1 },
  formContent: { paddingHorizontal: Spacing.xl },
  miniMapWrapper: {
    height: 140,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  miniMap: { flex: 1 },
  changeLocationBtn: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    elevation: 2,
  },
  changeLocationText: {
    ...Typography.small,
    color: Colors.primary,
    fontWeight: '700',
  },
  fieldLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    height: 48,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  labelRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  labelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.surface,
  },
  labelChipActive: {
    backgroundColor: Colors.primary,
  },
  labelChipText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  labelChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
});

export default AddAddressScreen;
