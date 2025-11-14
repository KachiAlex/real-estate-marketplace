import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="home" size={80} color="#f97316" />
      <Text style={styles.title}>Property Ark</Text>
      <Text style={styles.subtitle}>Find Your Dream Property</Text>
      <ActivityIndicator size="large" color="#f97316" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  loader: {
    marginTop: 40,
  },
});


