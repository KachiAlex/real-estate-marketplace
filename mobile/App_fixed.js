import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  StatusBar, 
  SafeAreaView,
  Dimensions
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function App() {
  useEffect(() => {
    // App initialization logic
    console.log('PropertyArk App initialized');
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#ffffff"
        translucent={false}
      />
      
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('./assets/images/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {/* Title Section */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>PropertyArk</Text>
          <Text style={styles.subtitle}>Real Estate Marketplace</Text>
        </View>
        
        {/* Status Section */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>App Status: Ready</Text>
          <Text style={styles.description}>PropertyArk mobile app with custom branding</Text>
        </View>
        
        {/* Features Section */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Features:</Text>
          <Text style={styles.feature}>PropertyArk logo as app icon</Text>
          <Text style={styles.feature}>3-second splash screen</Text>
          <Text style={styles.feature}>Custom favicon for web</Text>
          <Text style={styles.feature}>Production build ready</Text>
        </View>
        
        {/* Package Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.info}>Package: com.propertyark.mobile</Text>
          <Text style={styles.info}>Version: 1.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#f8f9fa',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: 80,
    height: 80,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#7f8c8d',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  featuresContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  feature: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoContainer: {
    alignItems: 'center',
  },
  info: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
});
