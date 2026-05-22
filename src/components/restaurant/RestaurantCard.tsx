// Restaurant Card Component - with Theme Support
import React, { useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Typography, Spacing, BorderRadius } from '../../constants';
import type { Restaurant } from '../../types';
import { formatCurrency, getDeliveryTimeRange } from '../../utils';
import { useTheme } from '../../theme/ThemeContext';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress: (restaurant: Restaurant) => void;
  compact?: boolean;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  onPress,
  compact = false,
}) => {
  const { colors } = useTheme();

  const handlePress = useCallback(
    () => onPress(restaurant),
    [restaurant, onPress],
  );

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={handlePress}
        activeOpacity={0.85}>
        <Image
          source={{ uri: restaurant.headerImageUrl }}
          style={styles.compactImage}
          resizeMode="cover"
        />
        {!restaurant.isOpen && (
          <View style={styles.closedOverlay}>
            <Text style={[styles.closedText, { color: colors.textSecondary }]}>Closed</Text>
          </View>
        )}
        <View style={styles.compactInfo}>
          <Text style={[styles.compactName, { color: colors.textPrimary }]} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View style={styles.ratingRow}>
            <Icon name="star" size={12} color={colors.starYellow} />
            <Text style={[styles.ratingText, { color: colors.textPrimary }]}>{restaurant.rating}</Text>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              · {getDeliveryTimeRange(restaurant.deliveryTimeMinutes)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={handlePress}
      activeOpacity={0.85}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: restaurant.headerImageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        {!restaurant.isOpen && (
          <View style={styles.closedOverlay}>
            <View style={[styles.closedBadge, { backgroundColor: colors.surface2 }]}>
              <Text style={[styles.closedBadgeText, { color: colors.textSecondary }]}>Closed</Text>
            </View>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View style={styles.ratingBadge}>
            <Icon name="star" size={12} color={colors.starYellow} />
            <Text style={[styles.ratingText, { color: colors.textPrimary }]}>{restaurant.rating}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.cuisine, { color: colors.textSecondary }]} numberOfLines={1}>
            {restaurant.cuisineType.join(' · ')}
          </Text>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            · {getDeliveryTimeRange(restaurant.deliveryTimeMinutes)}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={[styles.deliveryFee, { color: colors.primary }]}>
            {restaurant.deliveryFee === 0
              ? 'Free Delivery'
              : `${formatCurrency(restaurant.deliveryFee)} delivery`}
          </Text>
          <Text style={[styles.minOrder, { color: colors.textSecondary }]}>
            Min. {formatCurrency(restaurant.minimumOrder)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.base,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 160,
  },
  closedOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedBadge: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  closedBadgeText: {
    ...Typography.body,
    fontWeight: '600',
  },
  closedText: {
    ...Typography.h3,
  },
  info: {
    padding: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    flex: 1,
    marginRight: Spacing.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  ratingText: {
    ...Typography.small,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cuisine: {
    ...Typography.small,
    flex: 1,
  },
  metaText: {
    ...Typography.small,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  deliveryFee: {
    ...Typography.small,
    fontWeight: '600',
  },
  minOrder: {
    ...Typography.small,
  },
  // Compact card styles
  compactCard: {
    width: 200,
    marginRight: Spacing.md,
  },
  compactImage: {
    width: 200,
    height: 120,
    borderRadius: BorderRadius.md,
  },
  compactInfo: {
    marginTop: Spacing.sm,
  },
  compactName: {
    ...Typography.body,
    fontWeight: '700',
  },
});

export default React.memo(RestaurantCard);
