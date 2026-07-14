import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  BackHandler,
  Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';
import * as SplashScreen from 'expo-splash-screen';

// Keep splash screen visible while app loads
SplashScreen.preventAutoHideAsync();

const WEB_APP_URL = 'https://propertyark.vercel.app';

export default function App() {
  const webViewRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [error, setError] = useState(null);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  // Hide splash screen after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      SplashScreen.hideAsync();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, []);

  const handleWebViewLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    setError(nativeEvent.description);
    setIsLoading(false);
  };

  // Offline screen
  if (!isOnline) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.centerContent}>
          <Text style={styles.offlineTitle}>No Internet Connection</Text>
          <Text style={styles.offlineText}>
            Please check your internet connection and try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error screen
  if (error && !isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.centerContent}>
          <Text style={styles.errorTitle}>Failed to Load App</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>
            Please check your connection and restart the app.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Splash screen
  if (showSplash) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.centerContent}>
          <Image
            source={require('./assets/icon.png')}
            style={styles.splashLogo}
            resizeMode="contain"
          />
          <Text style={styles.splashTitle}>PropertyArk</Text>
          <Text style={styles.splashSubtitle}>Real Estate Marketplace</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_APP_URL }}
        style={styles.webView}
        onLoad={handleWebViewLoad}
        onError={handleWebViewError}
        startInLoadingState={true}
        scalesPageToFit={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        cacheEnabled={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading PropertyArk...</Text>
          </View>
        )}
        pullToRefreshEnabled={true}
        onShouldStartLoadWithRequest={(request) => {
          // Allow all requests
          return true;
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webView: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  splashLogo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  splashSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  offlineTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 12,
    textAlign: 'center',
  },
  offlineText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  errorHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

