import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { HeaderBar } from '@/src/components/common/HeaderBar';
import { StandaloneTabBar } from '@/src/components/navigation/StandaloneTabBar';
import { useTheme } from '@/src/context/ThemeContext';

export default function CitizenIdApplicationLayout() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  return (
    <View style={[styles.shell, isDarkMode && { backgroundColor: '#0B132B' }]}>
      <HeaderBar
        subtitle="Citizen ID & Registry Services"
        onNotificationPress={() => router.push('/(tabs)/notifications' as any)}
      />
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
      </View>
      <StandaloneTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
});
