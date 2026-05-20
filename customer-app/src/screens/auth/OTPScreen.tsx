// OTP Screen
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Spacing } from '../../constants';

const OTPScreen: React.FC = () => {
  const navigation = useNavigation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = useCallback((text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (index === 5 && text) {
      // Auto submit
      console.log('OTP:', newOtp.join(''));
    }
  }, [otp]);

  const handleKeyPress = useCallback((e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Enter the code we sent to your phone</Text>
      <View style={styles.otpRow}>
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={(ref) => { inputRefs.current[i] = ref; }}
            style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
            value={digit}
            onChangeText={(t) => handleChange(t, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            keyboardType="number-pad"
            maxLength={1}
            selectionColor={Colors.primary}
          />
        ))}
      </View>
      <TouchableOpacity disabled={countdown > 0} onPress={() => setCountdown(30)}>
        <Text style={[styles.resend, countdown > 0 && styles.resendDisabled]}>
          {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.xl },
  header: { paddingTop: Spacing.xxl, paddingBottom: Spacing.xl },
  back: { width: 40, height: 40, justifyContent: 'center' },
  title: { ...Typography.h1, color: Colors.textPrimary, marginBottom: Spacing.xxl },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xxl },
  otpBox: {
    width: 48, height: 56, backgroundColor: Colors.surface2, borderRadius: 8,
    borderWidth: 1.5, borderColor: 'transparent', textAlign: 'center',
    fontSize: 24, fontWeight: '700', color: Colors.textPrimary,
  },
  otpBoxFilled: { borderColor: Colors.primary },
  resend: { ...Typography.body, color: Colors.primary, textAlign: 'center', fontWeight: '600' },
  resendDisabled: { color: Colors.textDisabled },
});

export default OTPScreen;
