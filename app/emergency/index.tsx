import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
export default function EmergencyIndexRoute() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Emergency & Disaster Response</Text>
        <Text style={styles.sub}>Coming Soon — DRRM Emergency Department Team</Text>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 130, width: '100%', maxWidth: 680, alignSelf: 'center' },
  content: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, minHeight: 300, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  sub: { fontSize: 13, color: '#64748B', textAlign: 'center' },
});
