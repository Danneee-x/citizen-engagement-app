import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { ThemeProvider as AppThemeProvider } from '@/src/context/ThemeContext';
import { SessionTimeoutProvider } from '@/src/context/SessionTimeoutContext';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AppThemeProvider>
      <SessionTimeoutProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
          <StatusBar style="auto" />
        </ThemeProvider>
      </SessionTimeoutProvider>
    </AppThemeProvider>
  );
}
