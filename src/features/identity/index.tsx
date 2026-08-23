import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
export { default as AuthScreen } from './components/AuthScreen';
export { ProfileScreen } from './ProfileScreen';
export { VerifyCitizenScreen } from './screens/VerifyCitizenScreen';

export function IdentityDomainCard() {
  return (
    <Card variant="outlined">
      <View style={styles.header}>
        <Text style={styles.title}>Digital Citizen Identity & Barangay Registry</Text>
        <Badge label="Verified" variant="success" />
      </View>
      <Text style={styles.desc}>
        Access Barangay Certificates, Digital Citizen ID, Civil Registry documents & express feedback.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8, color: '#0F172A' },
  desc: { fontSize: 13, color: '#64748B', marginTop: 6 },
});
