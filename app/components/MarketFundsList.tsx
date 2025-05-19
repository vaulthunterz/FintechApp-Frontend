import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

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
}

interface MarketFundsListProps {
  onFundPress?: (fund: MarketFund) => void;
  showAll?: boolean;
  limit?: number;
}

const MarketFundsList: React.FC<MarketFundsListProps> = ({ onFundPress, showAll = false, limit = 3 }) => {
  const { colors } = useTheme();
  const [funds, setFunds] = useState<MarketFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarketFunds = async () => {
      try {
        setLoading(true);
        const response = await api.get('/investment/market-funds/');
        setFunds(showAll ? response.data : response.data.slice(0, limit));
      } catch (err) {
        console.error('Error fetching market funds:', err);
        setError('Failed to load market funds. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketFunds();
  }, [limit, showAll]);

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

  const renderFundItem = ({ item }: { item: MarketFund }) => (
    <TouchableOpacity
      style={[styles.fundCard, { backgroundColor: colors.card }]}
      onPress={() => onFundPress && onFundPress(item)}
    >
      <View style={styles.fundHeader}>
        <Text style={[styles.fundName, { color: colors.text }]}>{item.name}</Text>
        <View style={[styles.riskBadge, { backgroundColor: getRiskColor(item.risk_level) + '22' }]}>
          <Text style={[styles.riskText, { color: getRiskColor(item.risk_level) }]}>
            {item.risk_level} Risk
          </Text>
        </View>
      </View>
      
      <Text style={[styles.fundManager, { color: colors.textSecondary }]}>
        {item.fund_manager}
      </Text>
      
      <View style={styles.fundDetails}>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Return</Text>
          <Text style={[styles.detailValue, { color: colors.primary }]}>
            {item.rate_of_return}%
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Min. Invest</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            KES {item.minimum_investment.toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Fee</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {item.management_fee}%
          </Text>
        </View>
      </View>
      
      {item.description && (
        <Text 
          style={[styles.fundDescription, { color: colors.textSecondary }]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.description}
        </Text>
      )}
      
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.primary + '1A' }]}
          onPress={() => onFundPress && onFundPress(item)}
        >
          <Text style={[styles.actionText, { color: colors.primary }]}>View Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={24} color={colors.danger} />
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={funds}
      renderItem={renderFundItem}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  fundCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fundName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '500',
  },
  fundManager: {
    fontSize: 14,
    marginBottom: 12,
  },
  fundDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  fundDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    borderRadius: 8,
    margin: 16,
  },
  errorText: {
    marginLeft: 8,
    flex: 1,
  },
});

export default MarketFundsList;
