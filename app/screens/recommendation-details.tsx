import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import * as api from '../services/api';
import aiService from '../services/aiService';

interface RecommendationDetails {
  id: string;
  name: string;
  type: string;
  risk_level: string;
  expected_return: string;
  time_horizon: string;
  description: string;
  gemini_analysis?: string;
  historical_performance?: {
    date: string;
    value: number;
  }[];
  pros?: string[];
  cons?: string[];
  suitable_for?: string[];
  market_outlook?: string;
  allocation_percentage?: number;
  asset_class?: string;
}

const RecommendationDetailsScreen = () => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState<RecommendationDetails | null>(null);
  const [geminiAnalysisLoading, setGeminiAnalysisLoading] = useState(false);
  const params = useLocalSearchParams();
  const recommendationId = params.id as string;

  useEffect(() => {
    if (recommendationId) {
      fetchRecommendationDetails();
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Recommendation ID is missing'
      });
      router.back();
    }
  }, [recommendationId]);

  const fetchRecommendationDetails = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from API
      const response = await api.fetchRecommendationDetails(recommendationId);
      
      if (response && response.recommendation) {
        setRecommendation(response.recommendation);
      } else {
        // Fallback to sample data if API fails
        const sampleRecommendation: RecommendationDetails = {
          id: recommendationId,
          name: 'Diversified ETF Portfolio',
          type: 'ETF',
          risk_level: 'medium',
          expected_return: '7-9%',
          time_horizon: '5-10 years',
          description: 'A balanced portfolio of ETFs covering US stocks, international stocks, and bonds. This recommendation provides broad market exposure with moderate risk and potential for long-term growth.',
          pros: [
            'Broad market diversification',
            'Lower fees compared to mutual funds',
            'Tax efficiency',
            'Liquidity and transparency'
          ],
          cons: [
            'Less active management',
            'May underperform in certain market conditions',
            'Dividend yields may be lower than individual stocks'
          ],
          suitable_for: [
            'Medium to long-term investors',
            'Investors seeking moderate growth with reduced volatility',
            'Those who prefer passive investment strategies'
          ],
          market_outlook: 'The outlook for diversified ETF portfolios remains positive in the current market environment. While volatility may persist due to economic uncertainties, a well-diversified approach helps mitigate specific sector risks.',
          allocation_percentage: 40,
          asset_class: 'Mixed'
        };
        
        setRecommendation(sampleRecommendation);
      }
    } catch (error) {
      console.error('Error fetching recommendation details:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch recommendation details'
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getGeminiAnalysis = async () => {
    if (!recommendation) return;
    
    try {
      setGeminiAnalysisLoading(true);
      
      // Create a prompt for Gemini to analyze the investment
      const prompt = `Provide a detailed analysis of this investment option:
      Name: ${recommendation.name}
      Type: ${recommendation.type}
      Risk Level: ${recommendation.risk_level}
      Expected Return: ${recommendation.expected_return}
      Time Horizon: ${recommendation.time_horizon}
      Description: ${recommendation.description}
      
      Include the following in your analysis:
      1. Key benefits and potential drawbacks
      2. Who this investment is most suitable for
      3. Current market outlook for this type of investment
      4. Factors that could affect performance
      5. How this fits in a diversified portfolio
      
      Format your response in clear paragraphs without bullet points.`;
      
      // Get analysis from Gemini via the AI service
      const geminiResponse = await aiService.getGeminiPrediction(prompt);
      
      if (geminiResponse && geminiResponse.text) {
        // Update the recommendation with Gemini's analysis
        setRecommendation({
          ...recommendation,
          gemini_analysis: geminiResponse.text
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Analysis Failed',
          text2: 'Could not generate analysis for this investment'
        });
      }
    } catch (error) {
      console.error('Error getting Gemini analysis:', error);
      Toast.show({
        type: 'error',
        text1: 'Analysis Error',
        text2: 'Failed to analyze this investment option'
      });
    } finally {
      setGeminiAnalysisLoading(false);
    }
  };

  const handleAddToPortfolio = () => {
    if (!recommendation) return;
    
    Alert.alert(
      'Add to Portfolio',
      `Would you like to add ${recommendation.name} to your investment portfolio?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Add',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Create investment data object
              const investmentData = {
                name: recommendation.name,
                type: recommendation.type,
                risk_level: recommendation.risk_level,
                expected_return: recommendation.expected_return.replace(/%/g, '').split('-')[0], // Extract numeric value
                amount: 1000, // Default amount
                description: recommendation.description,
                asset_class: recommendation.asset_class || recommendation.type
              };
              
              // Call API to add investment to portfolio
              await api.addInvestment(investmentData);
              
              Toast.show({
                type: 'success',
                text1: 'Added to Portfolio',
                text2: `${recommendation.name} has been added to your portfolio`
              });
              
              // Navigate to portfolio view
              router.push('/screens/profile?source=investment');
            } catch (error) {
              console.error('Error adding to portfolio:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to add investment to portfolio'
              });
            }
          }
        }
      ]
    );
  };

  // Create dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: colors.background,
    },
    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    title: {
      color: colors.text,
    },
    subtitle: {
      color: colors.textSecondary,
    },
    text: {
      color: colors.text,
    },
    sectionTitle: {
      color: colors.text,
    },
    listItem: {
      color: colors.text,
    },
    addButton: {
      backgroundColor: colors.success,
    },
    addButtonText: {
      color: colors.headerText,
    },
    generateButton: {
      backgroundColor: colors.primary,
    },
    generateButtonText: {
      color: colors.headerText,
    },
    backButton: {
      color: colors.primary,
    },
    divider: {
      backgroundColor: colors.border,
    },
    analysisText: {
      color: colors.text,
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, dynamicStyles.title]}>Recommendation Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, dynamicStyles.text]}>Loading recommendation details...</Text>
        </View>
      </View>
    );
  }

  if (!recommendation) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, dynamicStyles.title]}>Recommendation Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={[styles.errorText, dynamicStyles.text]}>Recommendation not found</Text>
          <TouchableOpacity 
            style={[styles.backToListButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={{ color: colors.headerText }}>Back to Recommendations</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, dynamicStyles.title]}>Recommendation Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.detailsContainer, dynamicStyles.card]}>
          <Text style={[styles.detailsTitle, dynamicStyles.title]}>{recommendation.name}</Text>
          <View style={[styles.divider, dynamicStyles.divider]} />
          
          <View style={styles.detailsRow}>
            <View style={styles.detailsItem}>
              <Text style={[styles.detailsLabel, dynamicStyles.subtitle]}>Type</Text>
              <Text style={[styles.detailsValue, dynamicStyles.text]}>{recommendation.type}</Text>
            </View>
            <View style={styles.detailsItem}>
              <Text style={[styles.detailsLabel, dynamicStyles.subtitle]}>Risk Level</Text>
              <Text style={[styles.detailsValue, dynamicStyles.text]}>{recommendation.risk_level}</Text>
            </View>
          </View>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailsItem}>
              <Text style={[styles.detailsLabel, dynamicStyles.subtitle]}>Expected Return</Text>
              <Text style={[styles.detailsValue, dynamicStyles.text]}>{recommendation.expected_return}</Text>
            </View>
            <View style={styles.detailsItem}>
              <Text style={[styles.detailsLabel, dynamicStyles.subtitle]}>Time Horizon</Text>
              <Text style={[styles.detailsValue, dynamicStyles.text]}>{recommendation.time_horizon}</Text>
            </View>
          </View>
          
          {recommendation.allocation_percentage && (
            <View style={styles.allocationContainer}>
              <Text style={[styles.detailsLabel, dynamicStyles.subtitle]}>Recommended Allocation</Text>
              <View style={styles.allocationBar}>
                <View 
                  style={[
                    styles.allocationFill, 
                    { width: `${recommendation.allocation_percentage}%` }
                  ]} 
                />
              </View>
              <Text style={[styles.allocationPercentage, dynamicStyles.text]}>
                {recommendation.allocation_percentage}%
              </Text>
            </View>
          )}
          
          <View style={styles.descriptionContainer}>
            <Text style={[styles.detailsLabel, dynamicStyles.subtitle]}>Description</Text>
            <Text style={[styles.descriptionText, dynamicStyles.text]}>{recommendation.description}</Text>
          </View>
          
          {recommendation.pros && recommendation.pros.length > 0 && (
            <View style={styles.listContainer}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Key Benefits</Text>
              {recommendation.pros.map((pro, index) => (
                <View key={`pro-${index}`} style={styles.listItemContainer}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} style={styles.listIcon} />
                  <Text style={[styles.listItem, dynamicStyles.listItem]}>{pro}</Text>
                </View>
              ))}
            </View>
          )}
          
          {recommendation.cons && recommendation.cons.length > 0 && (
            <View style={styles.listContainer}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Potential Drawbacks</Text>
              {recommendation.cons.map((con, index) => (
                <View key={`con-${index}`} style={styles.listItemContainer}>
                  <Ionicons name="alert-circle" size={16} color={colors.warning} style={styles.listIcon} />
                  <Text style={[styles.listItem, dynamicStyles.listItem]}>{con}</Text>
                </View>
              ))}
            </View>
          )}
          
          {recommendation.suitable_for && recommendation.suitable_for.length > 0 && (
            <View style={styles.listContainer}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Suitable For</Text>
              {recommendation.suitable_for.map((suitability, index) => (
                <View key={`suit-${index}`} style={styles.listItemContainer}>
                  <Ionicons name="person" size={16} color={colors.primary} style={styles.listIcon} />
                  <Text style={[styles.listItem, dynamicStyles.listItem]}>{suitability}</Text>
                </View>
              ))}
            </View>
          )}
          
          {recommendation.market_outlook && (
            <View style={styles.marketOutlookContainer}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Market Outlook</Text>
              <Text style={[styles.marketOutlookText, dynamicStyles.text]}>{recommendation.market_outlook}</Text>
            </View>
          )}
          
          <View style={styles.analysisContainer}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Gemini AI Analysis</Text>
            {geminiAnalysisLoading ? (
              <View style={styles.analysisLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, dynamicStyles.text]}>Generating analysis...</Text>
              </View>
            ) : recommendation.gemini_analysis ? (
              <Text style={[styles.analysisText, dynamicStyles.analysisText]}>
                {recommendation.gemini_analysis}
              </Text>
            ) : (
              <TouchableOpacity 
                style={[styles.generateButton, dynamicStyles.generateButton]}
                onPress={getGeminiAnalysis}
              >
                <Text style={[styles.generateButtonText, dynamicStyles.generateButtonText]}>Generate AI Analysis</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.addToPortfolioButton, dynamicStyles.addButton]}
            onPress={handleAddToPortfolio}
          >
            <Text style={[styles.addToPortfolioButtonText, dynamicStyles.addButtonText]}>Add to Portfolio</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginVertical: 20,
  },
  backToListButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  detailsContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailsItem: {
    flex: 1,
  },
  detailsLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailsValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  allocationContainer: {
    marginBottom: 16,
  },
  allocationBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 8,
  },
  allocationFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  allocationPercentage: {
    fontSize: 14,
    fontWeight: '500',
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  listContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  marketOutlookContainer: {
    marginBottom: 16,
  },
  marketOutlookText: {
    fontSize: 14,
    lineHeight: 20,
  },
  analysisContainer: {
    marginBottom: 16,
  },
  analysisLoading: {
    alignItems: 'center',
    padding: 20,
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 20,
  },
  generateButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addToPortfolioButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addToPortfolioButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RecommendationDetailsScreen;
