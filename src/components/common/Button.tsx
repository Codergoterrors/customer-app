// Primary Button Component
import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Typography, BorderRadius, ComponentHeight, Spacing } from '../../constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'text';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
  icon,
}) => {
  const getButtonStyle = useCallback((): ViewStyle[] => {
    const base: ViewStyle[] = [styles.base];

    if (fullWidth) base.push(styles.fullWidth);

    switch (variant) {
      case 'primary':
        base.push(styles.primary);
        if (disabled) base.push(styles.primaryDisabled);
        break;
      case 'ghost':
        base.push(styles.ghost);
        if (disabled) base.push(styles.ghostDisabled);
        break;
      case 'danger':
        base.push(styles.danger);
        break;
      case 'text':
        base.push(styles.text);
        break;
    }

    if (style) base.push(style);
    return base;
  }, [variant, disabled, fullWidth, style]);

  const getTextStyle = useCallback((): TextStyle[] => {
    const base: TextStyle[] = [styles.buttonText];

    switch (variant) {
      case 'primary':
        base.push(styles.primaryText);
        break;
      case 'ghost':
        base.push(styles.ghostText);
        break;
      case 'danger':
        base.push(styles.dangerText);
        break;
      case 'text':
        base.push(styles.textOnlyText);
        break;
    }

    if (disabled) base.push(styles.disabledText);
    if (textStyle) base.push(textStyle);
    return base;
  }, [variant, disabled, textStyle]);

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'ghost' ? Colors.white : Colors.textInverse}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: ComponentHeight.button,
    borderRadius: BorderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  primaryDisabled: {
    backgroundColor: Colors.surface2,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  ghostDisabled: {
    borderColor: Colors.textDisabled,
  },
  danger: {
    backgroundColor: 'transparent',
  },
  text: {
    backgroundColor: 'transparent',
    height: 'auto',
    paddingHorizontal: 0,
  },
  buttonText: {
    ...Typography.button,
  },
  primaryText: {
    color: Colors.textInverse,
  },
  ghostText: {
    color: Colors.white,
  },
  dangerText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  textOnlyText: {
    color: Colors.primary,
  },
  disabledText: {
    color: Colors.textDisabled,
  },
});

export default React.memo(Button);
