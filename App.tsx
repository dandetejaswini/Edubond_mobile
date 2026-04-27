import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { COLORS } from './src/constants/colors';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor={COLORS.background} />
      <AppNavigator />
    </AuthProvider>
  );
}
