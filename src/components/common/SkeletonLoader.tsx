// Skeleton Shimmer Loader
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, Dimensions } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const SkeletonItem: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius },
        style,
      ]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

// Restaurant Card Skeleton
export const RestaurantCardSkeleton: React.FC = () => (
  <View style={styles.restaurantCard}>
    <SkeletonItem height={160} borderRadius={BorderRadius.md} />
    <View style={styles.cardContent}>
      <SkeletonItem height={18} width="70%" />
      <SkeletonItem
        height={14}
        width="50%"
        style={{ marginTop: Spacing.sm }}
      />
      <SkeletonItem
        height={14}
        width="40%"
        style={{ marginTop: Spacing.sm }}
      />
    </View>
  </View>
);

// Small Restaurant Card Skeleton (horizontal scroll)
export const SmallRestaurantCardSkeleton: React.FC = () => (
  <View style={styles.smallCard}>
    <SkeletonItem height={120} width={200} borderRadius={BorderRadius.md} />
    <SkeletonItem
      height={14}
      width={140}
      style={{ marginTop: Spacing.sm }}
    />
    <SkeletonItem
      height={12}
      width={100}
      style={{ marginTop: Spacing.xs }}
    />
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.shimmerBase,
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.shimmerHighlight,
    opacity: 0.3,
  },
  restaurantCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.base,
    overflow: 'hidden',
  },
  cardContent: {
    padding: Spacing.md,
  },
  smallCard: {
    width: 200,
    marginRight: Spacing.md,
  },
});

export default React.memo(SkeletonItem);
