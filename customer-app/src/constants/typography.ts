// FoodApp Customer — Typography System
// Using Inter font (closest free alternative to Uber Move)

import { TextStyle } from 'react-native';

export const FontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  extraBold: 'Inter-ExtraBold',
} as const;

export const FontSize = {
  xs: 10,
  sm: 11,
  small: 12,
  body: 14,
  bodyLarge: 16,
  h3: 18,
  h2: 20,
  h1: 24,
  display: 32,
  hero: 40,
} as const;

export const FontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semiBold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  extraBold: '800' as TextStyle['fontWeight'],
};

export const Typography = {
  display: {
    fontSize: FontSize.display,
    fontFamily: FontFamily.extraBold,
    fontWeight: FontWeight.extraBold,
    lineHeight: 40,
  } as TextStyle,

  h1: {
    fontSize: FontSize.h1,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    lineHeight: 32,
  } as TextStyle,

  h2: {
    fontSize: FontSize.h2,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    lineHeight: 28,
  } as TextStyle,

  h3: {
    fontSize: FontSize.h3,
    fontFamily: FontFamily.semiBold,
    fontWeight: FontWeight.semiBold,
    lineHeight: 24,
  } as TextStyle,

  bodyLarge: {
    fontSize: FontSize.bodyLarge,
    fontFamily: FontFamily.regular,
    fontWeight: FontWeight.regular,
    lineHeight: 22,
  } as TextStyle,

  body: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.regular,
    fontWeight: FontWeight.regular,
    lineHeight: 20,
  } as TextStyle,

  small: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    fontWeight: FontWeight.regular,
    lineHeight: 16,
  } as TextStyle,

  label: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    fontWeight: FontWeight.semiBold,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as TextStyle['textTransform'],
  } as TextStyle,

  button: {
    fontSize: FontSize.bodyLarge,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    lineHeight: 22,
  } as TextStyle,

  price: {
    fontSize: FontSize.bodyLarge,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    lineHeight: 22,
  } as TextStyle,

  caption: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    fontWeight: FontWeight.regular,
    lineHeight: 14,
  } as TextStyle,
} as const;
