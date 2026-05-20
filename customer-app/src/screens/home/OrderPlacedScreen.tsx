// Order Placed Animation Screen
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography } from '../../constants';
import type { HomeStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'OrderPlaced'>;
type Route = RouteProp<HomeStackParamList, 'OrderPlaced'>;

const OrderPlacedScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { orderId } = route.params;

  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const subTextOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate checkmark
    Animated.sequence([
      Animated.parallel([
        Animated.spring(checkScale, { toValue: 1, damping: 8, stiffness: 100, useNativeDriver: true }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }),
      Animated.timing(subTextOpacity, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }),
    ]).start();

    // Auto navigate after 2.5 seconds
    const timer = setTimeout(() => {
      navigation.replace('OrderTracking', { orderId });
    }, 2500);

    return () => clearTimeout(timer);
  }, [orderId, navigation]);

  return (
    <View style={s.container}>
      <Animated.View style={[s.checkContainer, { transform: [{ scale: checkScale }], opacity: checkOpacity }]}>
        <View style={s.checkCircle}>
          <Icon name="check" size={64} color={Colors.white} />
        </View>
      </Animated.View>

      <Animated.Text style={[s.title, { opacity: textOpacity }]}>
        Order Placed! 🎉
      </Animated.Text>

      <Animated.Text style={[s.subtitle, { opacity: subTextOpacity }]}>
        Hang tight, restaurant is confirming...
      </Animated.Text>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40,
  },
  checkContainer: { marginBottom: 32 },
  checkCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.white, textAlign: 'center' },
  subtitle: { ...Typography.body, color: 'rgba(255,255,255,0.85)', marginTop: 12, textAlign: 'center' },
});

export default OrderPlacedScreen;
