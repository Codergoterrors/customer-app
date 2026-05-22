// Root Navigator — Auth vs Main flow
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { useAppSelector } from '../store/hooks';
import AuthStack from './stacks/AuthStack';
import MainTabNavigator from './MainTabNavigator';
import { Colors } from '../constants';

const linking = {
  prefixes: ['foodapp://'],
  config: {
    screens: {
      HomeTab: {
        screens: {
          OrderTracking: 'order/:orderId',
        },
      },
    },
  },
};

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth,
  );

  return (
    <NavigationContainer linking={linking as any}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.background}
        translucent={false}
      />
      {isAuthenticated ? <MainTabNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default RootNavigator;
