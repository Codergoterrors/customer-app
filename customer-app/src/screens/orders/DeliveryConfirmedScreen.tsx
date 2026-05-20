// Delivery Confirmed Screen — Rating flow
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { Button } from '../../components';
import { useAppDispatch } from '../../store/hooks';
import { clearActiveOrder } from '../../store/slices/orderSlice';
import type { HomeStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'DeliveryConfirmed'>;
type Route = RouteProp<HomeStackParamList, 'DeliveryConfirmed'>;

const DeliveryConfirmedScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const dispatch = useAppDispatch();
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [riderRating, setRiderRating] = useState(0);
  const [review, setReview] = useState('');
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(celebrationScale, { toValue: 1, damping: 8, stiffness: 100, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleDone = useCallback(() => {
    dispatch(clearActiveOrder());
    navigation.popToTop();
  }, [dispatch, navigation]);

  const StarRow: React.FC<{ rating: number; onRate: (n: number) => void }> = ({ rating, onRate }) => (
    <View style={s.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onRate(n)}>
          <Icon name={n <= rating ? 'star' : 'star-outline'} size={32}
            color={n <= rating ? Colors.starYellow : Colors.textDisabled} />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={s.container}>
      <Animated.View style={[s.celebration, { transform: [{ scale: celebrationScale }] }]}>
        <Text style={s.emoji}>🎉</Text>
        <Text style={s.title}>Delivered!</Text>
        <Text style={s.subtitle}>Your food has arrived</Text>
      </Animated.View>

      <Animated.View style={[s.ratingSection, { opacity: contentOpacity }]}>
        <Text style={s.rateTitle}>Rate your experience</Text>

        <Text style={s.rateLabel}>Restaurant:</Text>
        <StarRow rating={restaurantRating} onRate={setRestaurantRating} />

        <Text style={s.rateLabel}>Rider:</Text>
        <StarRow rating={riderRating} onRate={setRiderRating} />

        <TextInput style={s.reviewInput} placeholder="Tell us more... (optional)"
          placeholderTextColor={Colors.textDisabled} value={review}
          onChangeText={setReview} multiline numberOfLines={3} />

        <Button title="Done" onPress={handleDone} style={{ marginTop: Spacing.xl }} />
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.xl },
  celebration: { alignItems: 'center', paddingTop: 80, marginBottom: Spacing.xxl },
  emoji: { fontSize: 64, marginBottom: Spacing.md },
  title: { ...Typography.h1, color: Colors.textPrimary, fontWeight: '800' },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.xs },
  ratingSection: { flex: 1 },
  rateTitle: { ...Typography.h3, color: Colors.textPrimary, fontWeight: '700', marginBottom: Spacing.xl },
  rateLabel: { ...Typography.body, color: Colors.textSecondary, fontWeight: '600', marginBottom: Spacing.sm, marginTop: Spacing.md },
  starRow: { flexDirection: 'row', gap: Spacing.sm },
  reviewInput: {
    backgroundColor: Colors.surface2, borderRadius: BorderRadius.sm, padding: Spacing.md,
    height: 80, ...Typography.body, color: Colors.textPrimary, marginTop: Spacing.xl,
    textAlignVertical: 'top',
  },
});

export default DeliveryConfirmedScreen;
