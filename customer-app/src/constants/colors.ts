// FoodApp Customer — Design System Colors
// Uber Eats inspired dark theme color palette

export const Colors = {
  // Primary
  primary: '#06C167',
  primaryDark: '#05A558',
  primaryLight: '#07D474',

  // Backgrounds
  background: '#000000',
  surface: '#1A1A1A',
  surface2: '#2C2C2C',
  surface3: '#3D3D3D',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E8E',
  textDisabled: '#555555',
  textInverse: '#000000',

  // UI Elements
  divider: '#2C2C2C',
  border: '#3D3D3D',
  error: '#FF4444',
  errorLight: '#FF6B6B',
  warning: '#FFC043',
  success: '#06C167',
  info: '#4A90D9',

  // Special
  starYellow: '#FFC043',
  overlay: 'rgba(0,0,0,0.6)',
  overlayLight: 'rgba(0,0,0,0.3)',
  overlayDark: 'rgba(0,0,0,0.8)',

  // Status
  statusPlaced: '#4A90D9',
  statusConfirmed: '#06C167',
  statusPreparing: '#FFC043',
  statusPickedUp: '#FF8C00',
  statusDelivered: '#06C167',
  statusCancelled: '#FF4444',

  // Shimmer
  shimmerBase: '#1A1A1A',
  shimmerHighlight: '#2C2C2C',

  // Transparent
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorKey = keyof typeof Colors;
