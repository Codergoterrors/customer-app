// FoodApp Customer — Main App Entry Point
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { store, persistor } from './src/store';
import { RootNavigator } from './src/navigation';
import { ThemeProvider } from './src/theme/ThemeContext';
import { StyleSheet } from 'react-native';

const App: React.FC = () => {
  useEffect(() => {
    // Must be called inside a component lifecycle (useEffect), NOT at module level.
    // On the New Architecture (Fabric/TurboModules), native modules aren't available
    // during bundle evaluation — calling setAccessToken at module scope causes
    // "Cannot read property 'setAccessToken' of undefined" crash on launch.
    MapLibreGL.setAccessToken(null);
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ThemeProvider>
            <SafeAreaProvider>
              <RootNavigator />
            </SafeAreaProvider>
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
