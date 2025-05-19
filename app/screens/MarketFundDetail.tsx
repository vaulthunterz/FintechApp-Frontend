import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

interface MarketFund {
  id: number;
  name: string;
  fund_type: string;
  fund_manager: string;
  rate_of_return: number;
  risk_level: string;
  minimum_investment: number;
  description: string;
  website_url: string;
  management_fee: number;
  total_assets?: number;
  inception_date?: string;
  investment_horizon?: string;
}

const MarketFundDetail = () => {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const router = useRouter();
  const [fund, setFund] = useState<MarketFund | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFundDetails = async () => {
      try {
        setLoading(true);
        const response = await api.getMarketFundDetails(id as string);
        if (!response.data) {
          throw new Error('No fund details returned from the server');
        }
        setFund(response.data);
      } catch (err) {
        console.error('Error fetching fund details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load fund details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFundDetails();
  }, [id]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return '#4CAF50'; // Green
      case 'medium':
        return '#FFC107'; // Amber
      case 'high':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Gray
    }
  };

  const handleInvestNow = () => {
    // Navigate to investment screen or show investment modal
    Alert.alert(
      'Start Investing',
      `Would you like to invest in ${fund?.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue',
          onPress: () => {
            // Navigate to investment screen with fund details
            router.push({
              pathname: '/invest',
              params: { fundId: fund?.id, fundName: fund?.name },
            });
          },
        },
      ]
    );
  };

  const handleVisitWebsite = () => {
    if (fund?.website_url) {
      Linking.openURL(
        fund.website_url.startsWith('http')
          ? fund.website_url
          : `https://${fund.website_url}`
      );
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${fund?.name} on FintechApp - ${fund?.fund_manager}'s fund with ${fund?.rate_of_return}% returns. ${fund?.website_url || ''}`,
        title: `${fund?.name} - Investment Opportunity`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </View>
    );
  }

  if (error || !fund) {
    return (
      <View style={[styles.container, styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={48} color={colors.danger} />
        <Text style={[styles.errorText, { color: colors.text }]}>
          {error || 'Fund not found'}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with gradient */}
      <LinearGradient
        colors={[colors.primary, '#6e45e2']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.fundName}>{fund.name}</Text>
          <TouchableOpacity onPress={handleShare}>
            <Ionicons name="share-social" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.returnBadge}>
          <Text style={styles.returnText}>{fund.rate_of_return}%</Text>
          <Text style={styles.returnLabel}>Annual Return</Text>
        </View>
      </LinearGradient>

      {/* Main content */}
      <View style={styles.content}>
        {/* Fund manager and type */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Fund Manager
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {fund.fund_manager}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Fund Type
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {fund.fund_type.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Risk level */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Risk Level
          </Text>
          <View style={styles.riskMeterContainer}>
            <View 
              style={[
                styles.riskMeter, 
                { 
                  backgroundColor: getRiskColor(fund.risk_level) + '33',
                  width: `${(fund.risk_level === 'low' ? 1 : fund.risk_level === 'medium' ? 2 : 3) * 33}%`,
                }
              ]}
            >
              <View 
                style={[
                  styles.riskLevel, 
                  { 
                    backgroundColor: getRiskColor(fund.risk_level),
                    alignSelf: fund.risk_level === 'low' ? 'flex-start' : 
                              fund.risk_level === 'medium' ? 'center' : 'flex-end'
                  }
                ]} 
              >
                <Text style={styles.riskLevelText}>{fund.risk_level.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.riskLabels}>
              <Text style={[styles.riskLabel, { color: colors.textSecondary }]}>
                Low
              </Text>
              <Text style={[styles.riskLabel, { color: colors.textSecondary }]}>
                Med
              </Text>
              <Text style={[styles.riskLabel, { color: colors.textSecondary }]}>
                High
              </Text>
            </View>
          </View>
        </View>

        {/* Key details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Key Details
          </Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <Ionicons name="cash-outline" size={24} color={colors.primary} />
              <Text style={[styles.detailCardLabel, { color: colors.textSecondary }]}>
                Min. Investment
              </Text>
              <Text style={[styles.detailCardValue, { color: colors.text }]}>
                KES {fund.minimum_investment.toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </Text>
            </View>
            <View style={styles.detailCard}>
              <Ionicons name="pricetag-outline" size={24} color={colors.primary} />
              <Text style={[styles.detailCardLabel, { color: colors.textSecondary }]}>
                Management Fee
              </Text>
              <Text style={[styles.detailCardValue, { color: colors.text }]}>
                {fund.management_fee}% p.a.
              </Text>
            </View>
            {fund.total_assets && (
              <View style={styles.detailCard}>
                <Ionicons name="pie-chart-outline" size={24} color={colors.primary} />
                <Text style={[styles.detailCardLabel, { color: colors.textSecondary }]}>
                  Total Assets
                </Text>
                <Text style={[styles.detailCardValue, { color: colors.text }]}>
                  KES {(fund.total_assets / 1000000).toLocaleString('en-KE', {minimumFractionDigits: 1, maximumFractionDigits: 1})}M
                </Text>
              </View>
            )}
            {fund.investment_horizon && (
              <View style={styles.detailCard}>
                <Ionicons name="time-outline" size={24} color={colors.primary} />
                <Text style={[styles.detailCardLabel, { color: colors.textSecondary }]}>
                  Horizon
                </Text>
                <Text style={[styles.detailCardValue, { color: colors.text }]}>
                  {fund.investment_horizon.charAt(0).toUpperCase() + fund.investment_horizon.slice(1)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            About This Fund
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {fund.description}
          </Text>
        </View>

        {/* Website link */}
        {fund.website_url && (
          <TouchableOpacity 
            style={[styles.websiteButton, { borderColor: colors.primary }]}
            onPress={handleVisitWebsite}
          >
            <Ionicons name="globe-outline" size={20} color={colors.primary} />
            <Text style={[styles.websiteButtonText, { color: colors.primary }]}>
              Visit Fund Website
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Fixed action button */}
      <View style={[styles.actionBar, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          style={[styles.investButton, { backgroundColor: colors.primary }]}
          onPress={handleInvestNow}
        >
          <Text style={styles.investButtonText}>Invest Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  fundName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  returnBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  returnText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  returnLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  riskMeterContainer: {
    marginBottom: 8,
  },
  riskMeter: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  riskLevel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '33.33%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  riskLevelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  riskLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  riskLabel: {
    fontSize: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  detailCard: {
    width: '50%',
    padding: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  detailCardLabel: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  detailCardValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  websiteButtonText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  investButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  investButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MarketFundDetail;
