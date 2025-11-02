import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mockProperties } from '../utils/mockData';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const featuredProperty = mockProperties[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning</Text>
          <Text style={styles.welcomeText}>Find Your Dream Property</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate('Properties')}
      >
        <Ionicons name="search-outline" size={20} color="#9ca3af" />
        <Text style={styles.searchText}>Search properties...</Text>
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionCard}>
          <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="home-outline" size={24} color="#f97316" />
          </View>
          <Text style={styles.actionText}>Buy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="key-outline" size={24} color="#3b82f6" />
          </View>
          <Text style={styles.actionText}>Rent</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <View style={[styles.actionIcon, { backgroundColor: '#d1fae5' }]}>
            <Ionicons name="trending-up-outline" size={24} color="#10b981" />
          </View>
          <Text style={styles.actionText}>Invest</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <View style={[styles.actionIcon, { backgroundColor: '#fce7f3' }]}>
            <Ionicons name="calculator-outline" size={24} color="#ec4899" />
          </View>
          <Text style={styles.actionText}>Mortgage</Text>
        </TouchableOpacity>
      </View>

      {/* Featured Property */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Property</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Properties')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.featuredCard}
          onPress={() => navigation.navigate('PropertyDetail', { property: featuredProperty })}
        >
          <Image source={{ uri: featuredProperty.images[0] }} style={styles.featuredImage} />
          <View style={styles.featuredContent}>
            <Text style={styles.featuredTitle}>{featuredProperty.title}</Text>
            <View style={styles.featuredLocation}>
              <Ionicons name="location-outline" size={16} color="#6b7280" />
              <Text style={styles.featuredLocationText}>
                {featuredProperty.location.address}, {featuredProperty.location.city}
              </Text>
            </View>
            <View style={styles.featuredDetails}>
              <View style={styles.featuredDetailItem}>
                <Ionicons name="bed-outline" size={16} color="#6b7280" />
                <Text style={styles.featuredDetailText}>
                  {featuredProperty.details.bedrooms} Beds
                </Text>
              </View>
              <View style={styles.featuredDetailItem}>
                <Ionicons name="water-outline" size={16} color="#6b7280" />
                <Text style={styles.featuredDetailText}>
                  {featuredProperty.details.bathrooms} Baths
                </Text>
              </View>
              <View style={styles.featuredDetailItem}>
                <Ionicons name="resize-outline" size={16} color="#6b7280" />
                <Text style={styles.featuredDetailText}>
                  {featuredProperty.details.sqft} sqft
                </Text>
              </View>
            </View>
            <View style={styles.featuredPriceContainer}>
              <Text style={styles.featuredPrice}>
                ₦{(featuredProperty.price / 1000000).toFixed(1)}M
              </Text>
              {featuredProperty.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Recent Properties */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Properties</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Properties')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {mockProperties.slice(1).map((property) => (
            <TouchableOpacity
              key={property.id}
              style={styles.propertyCard}
              onPress={() => navigation.navigate('PropertyDetail', { property })}
            >
              <Image source={{ uri: property.images[0] }} style={styles.propertyImage} />
              <View style={styles.propertyContent}>
                <Text style={styles.propertyTitle} numberOfLines={2}>
                  {property.title}
                </Text>
                <Text style={styles.propertyLocation} numberOfLines={1}>
                  {property.location.city}
                </Text>
                <View style={styles.propertyDetails}>
                  <View style={styles.propertyDetailItem}>
                    <Ionicons name="bed-outline" size={12} color="#6b7280" />
                    <Text style={styles.propertyDetailText}>
                      {property.details.bedrooms}
                    </Text>
                  </View>
                  <View style={styles.propertyDetailItem}>
                    <Ionicons name="water-outline" size={12} color="#6b7280" />
                    <Text style={styles.propertyDetailText}>
                      {property.details.bathrooms}
                    </Text>
                  </View>
                </View>
                <Text style={styles.propertyPrice}>
                  ₦{(property.price / 1000000).toFixed(1)}M
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: '#6b7280',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchText: {
    marginLeft: 12,
    color: '#9ca3af',
    fontSize: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  actionCard: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#f97316',
    fontWeight: '600',
  },
  featuredCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 32,
  },
  featuredImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f3f4f6',
  },
  featuredContent: {
    padding: 16,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  featuredLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredLocationText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  featuredDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  featuredDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  featuredDetailText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  featuredPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f97316',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46',
  },
  propertyCard: {
    width: width * 0.75,
    marginLeft: 20,
    marginRight: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f3f4f6',
  },
  propertyContent: {
    padding: 12,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  propertyDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  propertyDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  propertyDetailText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f97316',
  },
});

