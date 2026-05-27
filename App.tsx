// FoodApp Customer — Main App Entry Point
import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store, persistor } from './src/store';
import { RootNavigator } from './src/navigation';
import { ThemeProvider } from './src/theme/ThemeContext';
import { StyleSheet } from 'react-native';

const App: React.FC = () => {
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
