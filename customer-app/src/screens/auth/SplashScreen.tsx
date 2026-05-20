// Splash Screen — Animated logo with auth check
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography } from '../../constants';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import type { AuthStackParamList } from '../../types';

const { width } = Dimensions.get('window');

type SplashNav = NativeStackNavigationProp<AuthStackParamList, 'Splash'>;

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashNav>();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;
  const loadingWidth = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo fade in + scale
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 1000,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(loadingWidth, {
        toValue: width * 0.4,
        duration: 2000,
        useNativeDriver: false,
      }),
    ]).start();

    // After 2 seconds, slide up and fade out, then navigate
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoTranslateY, {
          toValue: -60,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isAuthenticated) {
          // Will be handled by RootNavigator switching to MainTabNavigator
        } else {
          navigation.replace('Welcome');
        }
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigation]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }, { translateY: logoTranslateY }],
          },
        ]}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoEmoji}>🍽️</Text>
        </View>
        <Text style={styles.logoText}>FoodApp</Text>
        <Animated.Text style={[styles.tagline, { opacity: textOpacity }]}>
          Delivered to your door
        </Animated.Text>
      </Animated.View>

      <View style={styles.loadingContainer}>
        <Animated.View
          style={[styles.loadingBar, { width: loadingWidth }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 40,
  },
  logoText: {
    ...Typography.display,
    color: Colors.textPrimary,
    fontSize: 36,
    letterSpacing: -1,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 60,
    height: 3,
    width: width * 0.4,
    backgroundColor: Colors.surface2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  loadingBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 999,
  },
});

export default SplashScreen;
