# FoodApp — Customer Application 

This directory contains the source code for the **Customer Application** of the FoodApp ecosystem. It is a React Native app built with TypeScript, Redux Toolkit, and Firebase. 

## 🚀 Features

- **Authentication**: Email/password sign-up and login with Firebase Auth.
- **Dynamic Design System**: Custom theming (Uber Eats style dark theme) using highly modular constants for typography, colors, and spacing.
- **Home & Discovery**: Promotional carousels, horizontal categories, and restaurant listings with shimmer loading effects.
- **Real-Time Order Tracking**: Interactive map placeholders, driver assigned details, and order status progression (Powered by Firebase Firestore and Cloud Functions).
- **Cart & Checkout**: Multi-item cart state management with Redux, promotional codes, and complex calculation for taxes and delivery fees.
- **State Management**: Redux Toolkit for clean slicing of `auth`, `cart`, `order`, `location`, and `notification` states. Includes Redux Persist for offline persistence.
- **Animations**: Fluid animations with Reanimated and standard React Native Animated for splash screens, bottom sheets, and completion celebrations.

## 📁 Project Structure

```
customer-app/
├── firebase/           # Firebase Cloud Functions and Security Rules
├── src/
│   ├── components/     # Reusable UI components (Buttons, Inputs, Cards, Skeletons)
│   ├── constants/      # Design system tokens (Colors, Typography, Layout)
│   ├── hooks/          # Custom hooks (Typed Redux hooks)
│   ├── navigation/     # React Navigation setup (Stacks & Bottom Tabs)
│   ├── screens/        # UI Screens organized by flow (auth, home, orders, account)
│   ├── services/       # Firebase integration layers (Auth, Firestore wrappers)
│   ├── store/          # Redux Toolkit configuration and slices
│   ├── types/          # Global TypeScript interfaces
│   └── utils/          # Helper functions and Mock Data
└── App.tsx             # Application Entry Point
```
  
## 🛠️ Setup & Running

1. **Install Dependencies**:
   Due to React 19 peer dependencies, install using legacy peers: 
   ```bash
   npm install --legacy-peer-deps
   ```
   
2. **iOS Setup**:
   ```bash
   cd ios
   pod install
   cd ..
   npm run ios
   ```

3. **Android Setup**:
   ```bash
   npm run android
   ```

## 🔗 Next Steps & Integration

- Connect Firebase `google-services.json` and `GoogleService-Info.plist` to receive live Push Notifications.
- Remove `utils/mockData.ts` implementations once the **Admin Dashboard** is developed to seed real restaurant data to Firestore.
