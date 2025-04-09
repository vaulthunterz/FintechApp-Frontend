import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Stack, router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import QuestionnaireReminder from '../components/investment/QuestionnaireReminder';
import api from '../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebDonutChart from '../components/charts/WebDonutChart';
import WebTimeSeriesChart from '../components/charts/WebTimeSeriesChart';
import ChartSelector from '../components/charts/ChartSelector';
import type { ChartType } from '../components/charts/ChartSelector';
import FilterControls, { FilterOptions } from '../components/filters/FilterControls';
import { getDefaultFilters } from '../utils/filterUtils';

// Add type definition for asset allocation items
interface AssetAllocation {
  type: string;
  percentage: number;
  value: number;
}

const InvestmentScreen = () => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [investmentSummary, setInvestmentSummary] = useState({
    totalInvested: 0,
    currentValue: 0,
    returns: 0,
    returnsPercentage: 0
  });

  const [assetAllocation, setAssetAllocation] = useState<AssetAllocation[]>([
    { type: 'Stocks', percentage: 0, value: 0 },
    { type: 'Bonds', percentage: 0, value: 0 },
    { type: 'Cash', percentage: 0, value: 0 }
  ]);
  const [selectedChart, setSelectedChart] = useState<ChartType>('donut');
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterOptions>(getDefaultFilters());
  const screenWidth = Dimensions.get('window').width - 40;

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        // Get portfolio summary from API
        const portfolio = await api.getPortfolioSummary();

        if (portfolio) {
          // Set investment summary
          setInvestmentSummary({
            totalInvested: portfolio.total_invested || 0,
            currentValue: portfolio.current_value || 0,
            returns: portfolio.returns || 0,
            returnsPercentage: portfolio.returns_percentage || 0
          });

          // Set asset allocation if available
          if (portfolio.asset_allocation && Array.isArray(portfolio.asset_allocation)) {
            setAssetAllocation(portfolio.asset_allocation.map((asset: any) => ({
              type: asset.type,
              percentage: asset.percentage,
              value: asset.value
            })));
          }

          // Generate performance data (this would come from the API in a real app)
          const performanceHistory = [
            { x: 'Jan', y: portfolio.total_invested * 0.98 },
            { x: 'Feb', y: portfolio.total_invested * 1.01 },
            { x: 'Mar', y: portfolio.total_invested * 1.03 },
            { x: 'Apr', y: portfolio.total_invested * 1.02 },
            { x: 'May', y: portfolio.total_invested * 1.05 },
            { x: 'Jun', y: portfolio.current_value }
          ];
          setPerformanceData([performanceHistory]);
        }
      } catch (error) {
        console.error('Error fetching portfolio data:', error);

        // Fallback to demo data
        setInvestmentSummary({
          totalInvested: 25000,
          currentValue: 27500,
          returns: 2500,
          returnsPercentage: 10
        });

        setAssetAllocation([
          { type: 'Stocks', percentage: 60, value: 16500 },
          { type: 'Bonds', percentage: 30, value: 8250 },
          { type: 'Cash', percentage: 10, value: 2750 }
        ]);

        // Generate demo performance data
        const demoPerformanceHistory = [
          { x: 'Jan', y: 25000 * 0.98 },
          { x: 'Feb', y: 25000 * 1.01 },
          { x: 'Mar', y: 25000 * 1.03 },
          { x: 'Apr', y: 25000 * 1.02 },
          { x: 'May', y: 25000 * 1.05 },
          { x: 'Jun', y: 27500 }
        ];
        setPerformanceData([demoPerformanceHistory]);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, []);

  const handleUpdateProfile = () => {
    router.push('/screens/profile');
  };

  const handleStartQuestionnaire = () => {
    router.push('/screens/investment-questionnaire');
  };

  const handleViewRecommendations = async () => {
    // In a real app, this would navigate to a recommendations screen
    try {
      const recommendations = await api.getInvestmentRecommendations(5000, 'medium');
      console.log('Recommendations:', recommendations);
      // Navigate to recommendations screen or show a modal
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Investment Dashboard',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />

      <ScrollView style={styles.scrollView}>
        {/* Questionnaire Reminder */}
        <QuestionnaireReminder isCompact={true} />

        {/* Investment Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Investment Summary</Text>

          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Invested</Text>
              <Text style={styles.summaryAmount}>${investmentSummary.totalInvested.toLocaleString()}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Current Value</Text>
              <Text style={styles.summaryAmount}>${investmentSummary.currentValue.toLocaleString()}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Returns</Text>
              <Text style={[
                styles.summaryAmount,
                investmentSummary.returns >= 0 ? styles.returnsPositive : styles.returnsNegative
              ]}>
                {investmentSummary.returns >= 0 ? '+' : '-'}${Math.abs(investmentSummary.returns).toLocaleString()} ({Math.abs(investmentSummary.returnsPercentage)}%)
              </Text>
            </View>
          </View>
        </View>

        {/* Asset Allocation Card with Enhanced Visualization */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Asset Allocation</Text>

          <FilterControls
            availableCategories={['Stocks', 'Bonds', 'Cash', 'Real Estate', 'Commodities']}
            filters={filters}
            onFiltersChange={setFilters}
          />

          <View style={styles.chartSelectionContainer}>
            <ChartSelector
              selectedChart={selectedChart}
              onSelectChart={setSelectedChart}
              availableCharts={['donut', 'timeSeries']}
            />
          </View>

          {selectedChart === 'donut' ? (
            <WebDonutChart
              data={assetAllocation.map(asset => ({
                x: asset.type,
                y: asset.value
              }))}
              title="Portfolio Allocation"
              width={screenWidth}
              colors={['#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#F44336']}
            />
          ) : (
            <WebTimeSeriesChart
              data={performanceData}
              title="Portfolio Performance"
              yAxisLabel="Value"
              xAxisLabel="Month"
              legendItems={[{ name: 'Portfolio Value', color: '#4CAF50' }]}
              width={screenWidth}
            />
          )}

          {assetAllocation.map((asset, index) => (
            <View key={index} style={styles.assetItem}>
              <View style={styles.assetHeader}>
                <Text style={styles.assetType}>{asset.type}</Text>
                <Text style={styles.assetPercentage}>{asset.percentage}%</Text>
              </View>

              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${asset.percentage}%`,
                      backgroundColor:
                        index === 0 ? '#1976d2' :
                        index === 1 ? '#2e7d32' : '#ff9800'
                    }
                  ]}
                />
              </View>

              <Text style={styles.assetValue}>${asset.value.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Actions Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actions</Text>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleUpdateProfile}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#e3f2fd' }]}>
                <Ionicons name="person" size={24} color="#1976d2" />
              </View>
              <Text style={styles.actionText}>Update Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleStartQuestionnaire}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#e8f5e9' }]}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={24} color="#2e7d32" />
              </View>
              <Text style={styles.actionText}>Investment Questionnaire</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleViewRecommendations}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#fff3e0' }]}>
                <FontAwesome5 name="chart-pie" size={20} color="#ff9800" />
              </View>
              <Text style={styles.actionText}>View Recommendations</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            The investment information provided is for demonstration purposes only.
            Past performance is not indicative of future results.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  returnsPositive: {
    color: '#2e7d32',
  },
  returnsNegative: {
    color: '#d32f2f',
  },
  assetItem: {
    marginBottom: 16,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  assetType: {
    fontSize: 14,
    color: '#333',
  },
  assetPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  assetValue: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chartSelectionContainer: {
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  disclaimer: {
    margin: 16,
    marginTop: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default InvestmentScreen;