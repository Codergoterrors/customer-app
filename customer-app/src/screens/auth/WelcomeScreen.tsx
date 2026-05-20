// Welcome Screen — Hero image with bottom sheet CTA
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { Button } from '../../components';
import type { AuthStackParamList } from '../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
type WelcomeNav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeNav>();
  const sheetTranslateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.spring(sheetTranslateY, {
      toValue: 0,
      damping: 20,
      stiffness: 120,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
      }}
      style={styles.background}
      resizeMode="cover">
      <View style={styles.overlay} />

      <Animated.View
        style={[
          styles.bottomSheet,
          { transform: [{ translateY: sheetTranslateY }] },
        ]}>
        <View style={styles.handle} />
        <Text style={styles.tagline}>
          Delicious food,{'\n'}delivered fast 🚀
        </Text>
        <Text style={styles.subText}>
          Order from the best restaurants near you and get it delivered to your
          doorstep in minutes.
        </Text>
        <View style={styles.buttonContainer}>
          <Button
            title="Get Started"
            onPress={() => navigation.navigate('Signup')}
          />
          <View style={{ height: Spacing.base }} />
          <Button
            title="Sign In"
            variant="ghost"
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      </Animated.View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: 48,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.surface2,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },
  tagline: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 36,
    marginBottom: Spacing.md,
  },
  subText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
    lineHeight: 22,
  },
  buttonContainer: {
    gap: 0,
  },
});

export default WelcomeScreen;
