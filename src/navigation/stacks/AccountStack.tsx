// Account Stack Navigator
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AccountStackParamList } from '../../types';

import ProfileScreen from '../../screens/account/ProfileScreen';
import AddressesScreen from '../../screens/account/AddressesScreen';
import NotificationsScreen from '../../screens/account/NotificationsScreen';

const Stack = createNativeStackNavigator<AccountStackParamList>();

const AccountStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#000000' },
      }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Addresses" component={AddressesScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
};

export default AccountStack;
