// Home Stack Navigator
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../types';

import HomeScreen from '../../screens/home/HomeScreen';
import SearchScreen from '../../screens/home/SearchScreen';
import RestaurantScreen from '../../screens/home/RestaurantScreen';
import CartScreen from '../../screens/home/CartScreen';
import CheckoutScreen from '../../screens/home/CheckoutScreen';
import OrderPlacedScreen from '../../screens/home/OrderPlacedScreen';
import OrderTrackingScreen from '../../screens/orders/OrderTrackingScreen';
import DeliveryConfirmedScreen from '../../screens/orders/DeliveryConfirmedScreen';
import AddAddressScreen from '../../screens/home/AddAddressScreen';
import HelpScreen from '../../screens/orders/HelpScreen';
import CancelOrderScreen from '../../screens/orders/CancelOrderScreen';
import OrderCancelledScreen from '../../screens/orders/OrderCancelledScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#000000' },
      }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Restaurant" component={RestaurantScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen
        name="OrderPlaced"
        component={OrderPlacedScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      <Stack.Screen
        name="DeliveryConfirmed"
        component={DeliveryConfirmedScreen}
      />
      <Stack.Screen name="AddAddress" component={AddAddressScreen} />
      <Stack.Screen
        name="Help"
        component={HelpScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="CancelOrder"
        component={CancelOrderScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="OrderCancelled"
        component={OrderCancelledScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
};

export default HomeStack;
