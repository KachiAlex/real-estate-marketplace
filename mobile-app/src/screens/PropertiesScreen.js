import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mockProperties } from '../utils/mockData';

const { width } = Dimensions.get('window');

export default function PropertiesScreen({ navigation }) {
  const [properties] = useState(mockProperties);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProperties, setFilteredProperties] = useState(properties);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query === '') {
      setFilteredProperties(properties);
    } else {
      const filtered = properties.filter(
        (property) =>
          property.title.toLowerCase().includes(query.toLowerCase()) ||
          property.location.city.toLowerCase().includes(query.toLowerCase()) ||
          property.location.address.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProperties(filtered);
    }
  };

  const renderPropertyCard = ({ item }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => navigation.navigate('PropertyDetail', { property: item })}
    >
      <Image source={{ uri: item.images[0] }} style={styles.propertyImage} />
      <View style={styles.propertyContent}>
        <Text style={styles.propertyTitle}>{item.title}</Text>
        <View style={styles.propertyLocation}>
          <Ionicons name="location-outline" size={14} color="#6b7280" />
          <Text style={styles.propertyLocationText}>
            {item.location.address}, {item.location.city}
          </Text>
        </View>
        <View style={styles.propertyDetails}>
          <View style={styles.propertyDetailItem}>
            <Ionicons name="bed-outline" size={14} color="#6b7280" />
            <Text style={styles.propertyDetailText}>
              {item.details.bedrooms}
            </Text>
          </View>
          <View style={styles.propertyDetailItem}>
            <Ionicons name="water-outline" size={14} color="#6b7280" />
            <Text style={styles.propertyDetailText}>
              {item.details.bathrooms}
            </Text>
          </View>
          <View style={styles.propertyDetailItem}>
            <Ionicons name="resize-outline" size={14} color="#6b7280" />
            <Text style={styles.propertyDetailText}>
              {item.details.sqft} sqft
            </Text>
          </View>
        </View>
        <View style={styles.propertyFooter}>
          <Text style={styles.propertyPrice}>
            ₦{(item.price / 1000000).toFixed(1)}M
          </Text>
          {item.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#10b981" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search properties..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          <Ionicons name="options-outline" size={20} color="#9ca3af" />
        </View>
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredProperties.length} properties found
        </Text>
      </View>

      {/* Properties List */}
      <FlatList
        data={filteredProperties}
        renderItem={renderPropertyCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  resultsHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  resultsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  listContent: {
    padding: 16,
  },
  propertyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f3f4f6',
  },
  propertyContent: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  propertyLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  propertyLocationText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  propertyDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  propertyDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  propertyDetailText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  propertyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyPrice: {
    fontSize: 20,
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
});

