// FoodApp Customer — Theme System
// Provides dark and light mode with React Context

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==================== COLOR PALETTES ====================

const DarkColors = {
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

  // Base
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',

  // Component-specific (Uber style)
  helpPillBg: '#1A1A1A',
  helpPillText: '#FFFFFF',
  shareBtnBg: '#1A1A1A',
  closeIconColor: '#FFFFFF',
  iconDefault: '#FFFFFF',
  progressTrack: '#2C2C2C',
  progressFill: '#06C167',
  cardBg: '#1A1A1A',
  riderActionBg: '#2C2C2C',
  radioBorder: '#555555',
  radioSelected: '#FFFFFF',
  radioDot: '#FFFFFF',
  cancelBtnBg: '#FFFFFF',
  cancelBtnText: '#000000',
  cancelBtnDisabledBg: '#2C2C2C',
  cancelBtnDisabledText: '#555555',
  confirmSheetBg: '#1A1A1A',
  goBackBtnBg: '#2C2C2C',
  goBackBtnText: '#FFFFFF',
  mapStyle: 'night',
} as const;

const LightColors = {
  // Primary
  primary: '#06C167',
  primaryDark: '#05A558',
  primaryLight: '#07D474',

  // Backgrounds
  background: '#FFFFFF',
  surface: '#F6F6F6',
  surface2: '#EBEBEB',
  surface3: '#E0E0E0',

  // Text
  textPrimary: '#000000',
  textSecondary: '#6B6B6B',
  textDisabled: '#B0B0B0',
  textInverse: '#FFFFFF',

  // UI Elements
  divider: '#F0F0F0',
  border: '#E0E0E0',
  error: '#FF4444',
  errorLight: '#FF6B6B',
  warning: '#FFC043',
  success: '#06C167',
  info: '#4A90D9',

  // Special
  starYellow: '#FFC043',
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.2)',
  overlayDark: 'rgba(0,0,0,0.7)',

  // Status
  statusPlaced: '#4A90D9',
  statusConfirmed: '#06C167',
  statusPreparing: '#FFC043',
  statusPickedUp: '#FF8C00',
  statusDelivered: '#06C167',
  statusCancelled: '#FF4444',

  // Shimmer
  shimmerBase: '#F0F0F0',
  shimmerHighlight: '#E0E0E0',

  // Base
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',

  // Component-specific (Uber style)
  helpPillBg: '#F6F6F6',
  helpPillText: '#000000',
  shareBtnBg: '#F6F6F6',
  closeIconColor: '#000000',
  iconDefault: '#000000',
  progressTrack: '#EBEBEB',
  progressFill: '#06C167',
  cardBg: '#F6F6F6',
  riderActionBg: '#F6F6F6',
  radioBorder: '#D0D0D0',
  radioSelected: '#000000',
  radioDot: '#000000',
  cancelBtnBg: '#000000',
  cancelBtnText: '#FFFFFF',
  cancelBtnDisabledBg: '#F0F0F0',
  cancelBtnDisabledText: '#B0B0B0',
  confirmSheetBg: '#FFFFFF',
  goBackBtnBg: '#F6F6F6',
  goBackBtnText: '#000000',
  mapStyle: 'standard',
} as const;

// ==================== TYPES ====================

export type ThemeMode = 'dark' | 'light';
export type ThemeColors = typeof DarkColors | typeof LightColors;

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

// ==================== CONTEXT ====================

const THEME_STORAGE_KEY = '@eatsapp_theme';

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  colors: DarkColors,
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

// ==================== PROVIDER ====================

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('dark');

  // Load saved theme on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setMode(saved);
      }
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const setTheme = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
  }, []);

  const value = useMemo<ThemeContextType>(() => ({
    mode,
    colors: mode === 'dark' ? DarkColors : LightColors,
    isDark: mode === 'dark',
    toggleTheme,
    setTheme,
  }), [mode, toggleTheme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// ==================== HOOK ====================

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export palettes for static usage (backward compat)
export { DarkColors, LightColors };
