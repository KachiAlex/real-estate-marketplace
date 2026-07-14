import React from 'react';
import { View, Text, StyleSheet, Image, StatusBar } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Image 
        source={require('./assets/images/icon.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>PropertyArk</Text>
      <Text style={styles.subtitle}>Real Estate Marketplace</Text>
      <Text style={styles.description}>App ready with custom logo!</Text>
      <Text style={styles.features}>Features:</Text>
      <Text style={styles.feature}>• PropertyArk logo as app icon</Text>
      <Text style={styles.feature}>• 3-second splash screen with logo</Text>
      <Text style={styles.feature}>• Custom favicon for web</Text>
      <Text style={styles.feature}>• Production build ready</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 32,
    color: '#7f8c8d',
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
    textAlign: 'center',
  },
  features: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  feature: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
    textAlign: 'center',
  },
});
