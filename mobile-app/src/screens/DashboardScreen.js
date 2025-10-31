import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mockProperties, mockInvestments, mockMortgages } from '../utils/mockData';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Dashboard</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="home-outline" size={24} color="#f97316" />
          </View>
          <Text style={styles.statValue}>{mockProperties.length}</Text>
          <Text style={styles.statLabel}>Properties</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="trending-up-outline" size={24} color="#3b82f6" />
          </View>
          <Text style={styles.statValue}>{mockInvestments.length}</Text>
          <Text style={styles.statLabel}>Investments</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
            <Ionicons name="document-text-outline" size={24} color="#10b981" />
          </View>
          <Text style={styles.statValue}>{mockMortgages.length}</Text>
          <Text style={styles.statLabel}>Mortgages</Text>
        </View>
      </View>

      {/* Saved Properties */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Properties</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {mockProperties.slice(0, 2).map((property) => (
            <TouchableOpacity
              key={property.id}
              style={styles.savedCard}
              onPress={() => navigation.navigate('PropertyDetail', { property })}
            >
              <View style={styles.savedIcon}>
                <Ionicons name="home" size={32} color="#f97316" />
              </View>
              <Text style={styles.savedTitle} numberOfLines={2}>
                {property.title}
              </Text>
              <Text style={styles.savedPrice}>
                ₦{(property.price / 1000000).toFixed(1)}M
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Active Investments */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Investments</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {mockInvestments.slice(0, 2).map((investment) => (
          <View key={investment.id} style={styles.investmentCard}>
            <View style={styles.investmentHeader}>
              <View style={styles.investmentIcon}>
                <Ionicons name="trending-up" size={24} color="#10b981" />
              </View>
              <View style={styles.investmentInfo}>
                <Text style={styles.investmentTitle}>{investment.title}</Text>
                <Text style={styles.investmentLocation}>
                  {investment.location.city}
                </Text>
              </View>
            </View>
            <View style={styles.investmentStats}>
              <View style={styles.investmentStat}>
                <Text style={styles.investmentStatLabel}>Return</Text>
                <Text style={styles.investmentStatValue}>
                  {investment.expectedReturn}%
                </Text>
              </View>
              <View style={styles.investmentStat}>
                <Text style={styles.investmentStatLabel}>Duration</Text>
                <Text style={styles.investmentStatValue}>
                  {investment.duration} months
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Mortgage Summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Mortgages</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {mockMortgages.map((mortgage) => (
          <View key={mortgage.id} style={styles.mortgageCard}>
            <View style={styles.mortgageHeader}>
              <View style={styles.mortgageIcon}>
                <Ionicons name="document-text" size={24} color="#3b82f6" />
              </View>
              <View style={styles.mortgageInfo}>
                <Text style={styles.mortgageTitle}>{mortgage.propertyTitle}</Text>
                <Text style={styles.mortgageStatus}>{mortgage.status}</Text>
              </View>
            </View>
            <View style={styles.mortgageDetails}>
              <View style={styles.mortgageDetail}>
                <Text style={styles.mortgageDetailLabel}>Monthly Payment</Text>
                <Text style={styles.mortgageDetailValue}>
                  ₦{(mortgage.monthlyPayment / 1000).toFixed(0)}K
                </Text>
              </View>
              <View style={styles.mortgageDetail}>
                <Text style={styles.mortgageDetailLabel}>Remaining</Text>
                <Text style={styles.mortgageDetailValue}>
                  ₦{(mortgage.remainingBalance / 1000000).toFixed(1)}M
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 24,
  },
  statCard: {
    alignItems: 'center',
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
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
  savedCard: {
    width: width * 0.6,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginLeft: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  savedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  savedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  savedPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f97316',
  },
  investmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  investmentHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  investmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  investmentInfo: {
    flex: 1,
  },
  investmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  investmentLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  investmentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  investmentStat: {
    alignItems: 'center',
  },
  investmentStatLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  investmentStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 4,
  },
  mortgageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mortgageHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  mortgageIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mortgageInfo: {
    flex: 1,
  },
  mortgageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  mortgageStatus: {
    fontSize: 14,
    color: '#10b981',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  mortgageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  mortgageDetail: {
    alignItems: 'center',
  },
  mortgageDetailLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  mortgageDetailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginTop: 4,
  },
});

