import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { ThemeProvider as AppThemeProvider } from '@/src/context/ThemeContext';
import { SessionTimeoutProvider } from '@/src/context/SessionTimeoutContext';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const isLargeScreen = Platform.OS === 'web' && width > 768;

  return (
    <AppThemeProvider>
      <SessionTimeoutProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <View style={[styles.rootContainer, isLargeScreen && styles.rootContainerLarge]}>
            <View style={[styles.appFrame, isLargeScreen && styles.appFrameLarge]}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="education" />
                <Stack.Screen name="health" />
                <Stack.Screen name="business" />
                <Stack.Screen name="housing" />
                <Stack.Screen name="emergency" />
                <Stack.Screen name="report-a-concern" />
                <Stack.Screen name="citizen-id-application" />
                <Stack.Screen name="certificate-requests" />
                <Stack.Screen name="public-surveys" />
                <Stack.Screen name="community-feedback" />
                <Stack.Screen name="my-reports" />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </Stack>
            </View>
          </View>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SessionTimeoutProvider>
    </AppThemeProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  rootContainerLarge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B132B',
  },
  appFrame: {
    flex: 1,
    width: '100%',
  },
  appFrameLarge: {
    maxWidth: 580,
    height: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 20,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#1E293B',
  },
});

