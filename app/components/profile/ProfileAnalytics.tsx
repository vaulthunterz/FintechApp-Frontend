import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface ProfileAnalyticsProps {
  profile: {
    risk_tolerance: number | string;
    investment_experience: string;
    investment_timeline: string;
    investment_goals: string;
  };
  questionnaire?: any; // Optional questionnaire data
  analytics?: {
    risk_score?: number;
    profile_risk_level?: number;
    investment_style?: string;
    allocation?: {
      stocks: number;
      bonds: number;
      cash: number;
    };
    portfolioSummary?: {
      total_invested: number;
      current_value: number;
      returns: number;
      returns_percentage: number;
      asset_allocation: Array<{
        type: string;
        percentage: number;
        value: number;
      }>;
    };
  };
}

const ProfileAnalytics: React.FC<ProfileAnalyticsProps> = ({ profile, questionnaire, analytics }) => {
  const { colors } = useTheme();
  // Debug logging to see what data we're receiving
  console.log('ProfileAnalytics received:', {
    profile,
    questionnaire,
    analytics
  });
  // Convert risk tolerance to a readable format
  const getRiskToleranceText = (risk: number | string): string => {
    if (typeof risk === 'number') {
      return risk === 1 ? 'Low' : risk === 2 ? 'Medium' : 'High';
    }
    return String(risk);
  };

  // Get risk tolerance color
  const getRiskToleranceColor = (risk: number | string): string => {
    if (typeof risk === 'number') {
      return risk === 1 ? colors.success : risk === 2 ? colors.warning : colors.error;
    }
    return colors.textSecondary;
  };

  // Get investment timeline in years
  const getTimelineYears = (timeline: string): string => {
    switch (timeline) {
      case 'short':
        return '< 3 years';
      case 'mid':
        return '3-10 years';
      case 'long':
        return '> 10 years';
      default:
        return timeline;
    }
  };

  // Calculate recommended allocation based on risk tolerance and timeline
  const getRecommendedAllocation = () => {
    // Use analytics data if available
    if (analytics?.allocation) {
      return analytics.allocation;
    }

    // Otherwise calculate based on profile data
    const riskLevel = typeof profile.risk_tolerance === 'number' ? profile.risk_tolerance : 1;
    const timeline = profile.investment_timeline;

    // Default conservative allocation
    let stocks = 20;
    let bonds = 50;
    let cash = 30;

    // Adjust based on risk tolerance
    if (riskLevel === 2) { // Medium
      stocks = 50;
      bonds = 40;
      cash = 10;
    } else if (riskLevel === 3) { // High
      stocks = 70;
      bonds = 25;
      cash = 5;
    }

    // Further adjust based on timeline
    if (timeline === 'long') {
      stocks += 10;
      bonds -= 5;
      cash -= 5;
    } else if (timeline === 'short') {
      stocks -= 10;
      bonds += 5;
      cash += 5;
    }

    // Ensure values are within reasonable ranges
    stocks = Math.max(0, Math.min(100, stocks));
    bonds = Math.max(0, Math.min(100, bonds));
    cash = Math.max(0, Math.min(100, cash));

    // Normalize to ensure they sum to 100%
    const total = stocks + bonds + cash;
    stocks = Math.round((stocks / total) * 100);
    bonds = Math.round((bonds / total) * 100);
    cash = 100 - stocks - bonds; // Ensure they sum to exactly 100

    return { stocks, bonds, cash };
  };

  // Get investment style based on risk and experience
  const getInvestmentStyle = (): string => {
    // Use analytics data if available
    if (analytics?.investment_style) {
      return analytics.investment_style;
    }

    // Otherwise calculate based on profile data
    const riskLevel = typeof profile.risk_tolerance === 'number' ? profile.risk_tolerance : 1;
    const experience = profile.investment_experience;

    if (riskLevel === 1) {
      return experience === 'beginner' ? 'Conservative' : 'Income-Focused';
    } else if (riskLevel === 2) {
      return experience === 'beginner' ? 'Balanced' : 'Growth & Income';
    } else {
      return experience === 'advanced' ? 'Aggressive Growth' : 'Growth';
    }
  };

  // Get suitable investment types based on profile and questionnaire
  const getSuitableInvestments = (): string[] => {
    // If user has specified preferred investment types in the questionnaire, use those
    if (questionnaire?.preferred_investment_types &&
        Array.isArray(questionnaire.preferred_investment_types) &&
        questionnaire.preferred_investment_types.length > 0) {

      console.log('Using user preferred investment types:', questionnaire.preferred_investment_types);

      // Map the investment type codes to display names
      const investmentTypeMap = {
        'money_market': 'Money Market Funds',
        'treasury': 'Treasury Bills',
        'bonds': 'Corporate Bonds',
        'mutual_funds': 'Balanced Mutual Funds',
        'stocks': 'Individual Stocks',
        'etfs': 'Sector ETFs',
        'reits': 'Real Estate Investment Trusts',
        'crypto': 'Cryptocurrencies',
        'fixed_deposits': 'Fixed Deposits',
        'savings': 'Savings Accounts'
      };

      // Convert the codes to display names
      return questionnaire.preferred_investment_types.map((type: string) => {
        return investmentTypeMap[type as keyof typeof investmentTypeMap] || type; // Use the mapping or the original if not found
      });
    }

    // Fallback to algorithm-based recommendations if no preferences specified
    const riskLevel = typeof profile.risk_tolerance === 'number' ? profile.risk_tolerance : 1;
    const timeline = profile.investment_timeline;
    const investments = [];

    // Low risk investments
    investments.push('Money Market Funds');
    investments.push('Treasury Bills');

    // Medium risk investments
    if (riskLevel >= 2) {
      investments.push('Corporate Bonds');
      investments.push('Balanced Mutual Funds');
    }

    // Higher risk investments
    if (riskLevel >= 3) {
      investments.push('Individual Stocks');
      investments.push('Sector ETFs');
    }

    // Long-term investments
    if (timeline === 'long') {
      investments.push('Real Estate Investment Trusts');
    }

    return investments;
  };

  // Use the analytics data or calculate fallbacks
  const allocation = getRecommendedAllocation();
  const investmentStyle = getInvestmentStyle();
  const suitableInvestments = getSuitableInvestments();

  // Get risk score from analytics or calculate from profile
  const riskScore = analytics?.risk_score ||
    (typeof profile.risk_tolerance === 'number' ? profile.risk_tolerance * 3 : 5);

  // Create dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: colors.card,
    },
    title: {
      color: colors.text,
    },
    sectionTitle: {
      color: colors.text,
    },
    riskLabel: {
      color: colors.textSecondary,
    },
    riskScoreLabel: {
      color: colors.textSecondary,
    },
    riskScoreBar: {
      backgroundColor: colors.border,
    },
    riskScoreIndicator: {
      backgroundColor: colors.primary,
    },
    riskScoreValue: {
      color: colors.text,
    },
    infoLabel: {
      color: colors.textSecondary,
    },
    infoValue: {
      color: colors.text,
    },
    allocationLabel: {
      color: colors.textSecondary,
    },
    investmentType: {
      backgroundColor: colors.background,
    },
    investmentTypeText: {
      color: colors.text,
    },
    goalsText: {
      color: colors.text,
    },
    questionnaireStatus: {
      color: colors.text,
    },
    // Portfolio summary styles
    portfolioLabel: {
      color: colors.textSecondary,
    },
    portfolioValue: {
      color: colors.text,
    },
    portfolioSubtitle: {
      color: colors.text,
    },
    assetName: {
      color: colors.text,
    },
    assetPercentage: {
      color: colors.textSecondary,
    },
    assetValue: {
      color: colors.text,
    },
    emptyPortfolioText: {
      color: colors.textSecondary,
    },
  };

  // Format currency values
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format percentage values
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  // Get portfolio summary data
  const portfolioSummary = analytics?.portfolioSummary || {
    total_invested: 0,
    current_value: 0,
    returns: 0,
    returns_percentage: 0,
    asset_allocation: []
  };

  // Determine if portfolio has data
  const hasPortfolioData = portfolioSummary.total_invested > 0 || portfolioSummary.current_value > 0;

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Text style={[styles.title, dynamicStyles.title]}>Investment Profile Analysis</Text>

      {/* Portfolio Summary Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Portfolio Summary</Text>

        {hasPortfolioData ? (
          <>
            <View style={styles.portfolioSummaryContainer}>
              <View style={styles.portfolioSummaryItem}>
                <Text style={[styles.portfolioLabel, dynamicStyles.portfolioLabel]}>Total Invested</Text>
                <Text style={[styles.portfolioValue, dynamicStyles.portfolioValue]}>
                  {formatCurrency(portfolioSummary.total_invested)}
                </Text>
              </View>

              <View style={styles.portfolioSummaryItem}>
                <Text style={[styles.portfolioLabel, dynamicStyles.portfolioLabel]}>Current Value</Text>
                <Text style={[styles.portfolioValue, dynamicStyles.portfolioValue]}>
                  {formatCurrency(portfolioSummary.current_value)}
                </Text>
              </View>

              <View style={styles.portfolioSummaryItem}>
                <Text style={[styles.portfolioLabel, dynamicStyles.portfolioLabel]}>Returns</Text>
                <Text style={[
                  styles.portfolioValue,
                  dynamicStyles.portfolioValue,
                  { color: portfolioSummary.returns >= 0 ? colors.success : colors.error }
                ]}>
                  {formatCurrency(portfolioSummary.returns)}
                  ({portfolioSummary.returns_percentage >= 0 ? '+' : ''}{formatPercentage(portfolioSummary.returns_percentage)})
                </Text>
              </View>
            </View>

            {/* Asset Allocation from Portfolio */}
            {portfolioSummary.asset_allocation && portfolioSummary.asset_allocation.length > 0 && (
              <View style={styles.portfolioAllocationContainer}>
                <Text style={[styles.portfolioSubtitle, dynamicStyles.portfolioSubtitle]}>Current Asset Allocation</Text>
                {portfolioSummary.asset_allocation.map((asset, index) => (
                  <View key={index} style={styles.portfolioAssetItem}>
                    <View style={styles.assetNameContainer}>
                      <View
                        style={[styles.assetColorIndicator, { backgroundColor: getAssetColor(asset.type, index, colors) }]}
                      />
                      <Text style={[styles.assetName, dynamicStyles.assetName]}>{asset.type}</Text>
                    </View>
                    <View style={styles.assetDetailsContainer}>
                      <Text style={[styles.assetPercentage, dynamicStyles.assetPercentage]}>
                        {formatPercentage(asset.percentage)}
                      </Text>
                      <Text style={[styles.assetValue, dynamicStyles.assetValue]}>
                        {formatCurrency(asset.value)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyPortfolioContainer}>
            <Text style={[styles.emptyPortfolioText, dynamicStyles.emptyPortfolioText]}>
              No portfolio data available. Start investing to see your portfolio summary.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Risk Profile</Text>
        <View style={styles.riskIndicator}>
          <Text style={[styles.riskLabel, dynamicStyles.riskLabel]}>Risk Tolerance:</Text>
          <View style={[
            styles.riskBadge,
            { backgroundColor: getRiskToleranceColor(profile.risk_tolerance) }
          ]}>
            <Text style={styles.riskBadgeText}>
              {getRiskToleranceText(profile.risk_tolerance)}
            </Text>
          </View>
        </View>

        {/* Always display risk score */}
        <View style={styles.riskScoreContainer}>
          <Text style={[styles.riskScoreLabel, dynamicStyles.riskScoreLabel]}>Risk Score:</Text>
          <View style={[styles.riskScoreBar, dynamicStyles.riskScoreBar]}>
            <View
              style={[styles.riskScoreIndicator, dynamicStyles.riskScoreIndicator, { width: `${(riskScore / 10) * 100}%` }]}
            />
          </View>
          <Text style={[styles.riskScoreValue, dynamicStyles.riskScoreValue]}>{riskScore}/10</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>Investment Horizon:</Text>
          <Text style={[styles.infoValue, dynamicStyles.infoValue]}>{getTimelineYears(profile.investment_timeline)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>Experience Level:</Text>
          <Text style={[styles.infoValue, dynamicStyles.infoValue]}>{profile.investment_experience}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>Investment Style:</Text>
          <Text style={[styles.infoValue, dynamicStyles.infoValue]}>
            {investmentStyle}
            {analytics?.investment_style ? ' (Based on Questionnaire)' : ''}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
          Recommended Allocation
          {analytics?.allocation ? ' (Based on Questionnaire)' : ''}
        </Text>
        <View style={styles.allocationContainer}>
          <View style={styles.allocationItem}>
            <View style={[styles.allocationBar, { width: `${allocation.stocks}%`, backgroundColor: colors.primary }]} />
            <Text style={[styles.allocationLabel, dynamicStyles.allocationLabel]}>Stocks: {allocation.stocks}%</Text>
          </View>

          <View style={styles.allocationItem}>
            <View style={[styles.allocationBar, { width: `${allocation.bonds}%`, backgroundColor: colors.success }]} />
            <Text style={[styles.allocationLabel, dynamicStyles.allocationLabel]}>Bonds: {allocation.bonds}%</Text>
          </View>

          <View style={styles.allocationItem}>
            <View style={[styles.allocationBar, { width: `${allocation.cash}%`, backgroundColor: colors.warning }]} />
            <Text style={[styles.allocationLabel, dynamicStyles.allocationLabel]}>Cash: {allocation.cash}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
          {questionnaire?.preferred_investment_types &&
           Array.isArray(questionnaire.preferred_investment_types) &&
           questionnaire.preferred_investment_types.length > 0
            ? 'Your Preferred Investments'
            : 'Suitable Investment Types'}
        </Text>
        <View style={styles.investmentTypesContainer}>
          {suitableInvestments.map((investment, index) => (
            <View key={index} style={[styles.investmentType, dynamicStyles.investmentType]}>
              <Text style={[styles.checkmark, { color: colors.success }]}>✓</Text>
              <Text style={[styles.investmentTypeText, dynamicStyles.investmentTypeText]}>{investment}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Goals</Text>
        <View style={styles.goalsContainer}>
          <Text style={[styles.goalsText, dynamicStyles.goalsText]}>{profile.investment_goals}</Text>
        </View>
      </View>

      {/* Questionnaire Status */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Questionnaire Status</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: questionnaire ? colors.success : colors.warning }]} />
          <Text style={[styles.statusText, dynamicStyles.questionnaireStatus]}>
            {questionnaire ? 'Questionnaire completed' : 'Questionnaire not completed'}
          </Text>
        </View>
        {!questionnaire && (
          <Text style={[styles.statusHint, dynamicStyles.questionnaireStatus]}>
            Complete the investment questionnaire to get personalized recommendations
          </Text>
        )}
      </View>
    </View>
  );

  // Helper function to get color for asset type
  function getAssetColor(assetType: string, index: number, colors: any): string {
    const assetTypeColors: Record<string, string> = {
      'stock': colors.primary,
      'bond': colors.success,
      'cash': colors.warning,
      'equity': colors.primary,
      'fixed': colors.success,
      'money': colors.warning,
      'real': colors.error,
      'alternative': colors.info
    };

    // Try to match asset type to predefined colors
    for (const [key, color] of Object.entries(assetTypeColors)) {
      if (assetType.toLowerCase().includes(key.toLowerCase())) {
        return color;
      }
    }

    // Fallback to a color based on index
    const fallbackColors = [colors.primary, colors.success, colors.warning, colors.error, colors.info];
    return fallbackColors[index % fallbackColors.length];
  }
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  riskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  riskBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  riskScoreContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  riskScoreLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  riskScoreBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  riskScoreIndicator: {
    height: '100%',
    backgroundColor: '#ff9800',
    borderRadius: 4,
  },
  riskScoreValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
    marginRight: 8,
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  allocationContainer: {
    marginTop: 8,
  },
  allocationItem: {
    marginBottom: 12,
  },
  allocationBar: {
    height: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  allocationLabel: {
    fontSize: 14,
    color: '#555',
  },
  investmentTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  investmentType: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  investmentTypeText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 4,
  },
  checkmark: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  goalsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  goalsText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  statusHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  // Portfolio summary styles
  portfolioSummaryContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  portfolioSummaryItem: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  portfolioLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  portfolioValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  portfolioAllocationContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  portfolioSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  portfolioAssetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  assetNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assetColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  assetName: {
    fontSize: 14,
    color: '#333',
  },
  assetDetailsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  assetPercentage: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  assetValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  emptyPortfolioContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginVertical: 8,
  },
  emptyPortfolioText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ProfileAnalytics;
