import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import api from '../services/api';
import aiService from '../services/aiService';
import { Button } from '@rneui/themed';

interface UserProfileData {
  risk_tolerance: number;
  income_level: string;
  investment_goals: string[];
  investment_timeframe: number;
  age: number;
  financial_knowledge: string;
  monthly_savings: number;
  emergency_fund: boolean;
}

interface Recommendation {
  id: string;
  name: string;
  risk_level: number;
  expected_return: number;
  minimum_investment: number;
  fund_manager: string;
  description?: string;
}

const InvestmentRecommendationsScreen = () => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false); // State for recommendations
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [refreshing, setRefreshing] = useState(false); // State for refresh action
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Show 5 recommendations per page
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [userProfileLoading, setUserProfileLoading] = useState(true);
  const [selectedFundDetails, setSelectedFundDetails] = useState<any>(null); // Add this line
  const [fundDetailsLoading, setFundDetailsLoading] = useState(false); // Add this line

  // Calculate paginated recommendations
  const paginatedRecommendations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return recommendations.slice(startIndex, endIndex);
  }, [recommendations, currentPage, itemsPerPage]);

  // Debug: Log recommendations whenever they change
  useEffect(() => {
    console.log('Recommendations state changed:', recommendations);
    console.log('Recommendations length:', recommendations.length);
    console.log('Current page:', currentPage);
    console.log('Paginated recommendations:', paginatedRecommendations);
  }, [recommendations, currentPage, itemsPerPage, paginatedRecommendations]);

  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [geminiAnalysisLoading, setGeminiAnalysisLoading] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState<string>('1000');
  const [investmentYears, setInvestmentYears] = useState<string>('5');
  const params = useLocalSearchParams();
  const riskLevel = params.riskLevel as string || 'medium';
  const amount = params.amount ? Number(params.amount) : 1000;

  console.log('Received params for recommendations:', { riskLevel, amount });

  useEffect(() => {
    fetchRecommendations(currentPage);
  }, [currentPage]);

  // Initial load
  useEffect(() => {
    fetchRecommendations(1);
    fetchUserProfile();
  }, []);

  // Fetch user profile data (match dashboard logic: merge questionnaire and profile, prioritize questionnaire fields)
  const fetchUserProfile = async () => {
    try {
      setUserProfileLoading(true);
      // Use the same API and merging logic as the dashboard
      const status = await api.checkQuestionnaireStatus();
      const profile = status.profile || {};
      const questionnaire = status.data || {};
      // Merge, prioritizing questionnaire fields
      const mergedProfile = Object.keys(questionnaire).length > 0
        ? { ...profile, ...questionnaire }
        : profile;
      setUserProfile(mergedProfile);
      console.log('User profile data (dashboard logic):', mergedProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    } finally {
      setUserProfileLoading(false);
    }
  };

  const fetchRecommendations = async (page: number = 1, isRefreshing: boolean = false) => {
    try {
      // Set loading state based on whether this is a refresh or initial load
      if (!isRefreshing) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      // First check if the questionnaire is completed
      console.log('Checking questionnaire status before generating recommendations...');
      const questionnaireStatus = await api.checkQuestionnaireStatus();
      console.log('Questionnaire status:', questionnaireStatus);

      if (!questionnaireStatus.isCompleted) {
        console.log('Questionnaire not completed, redirecting to questionnaire form');
        Toast.show({
          type: 'info',
          text1: 'Questionnaire Required',
          text2: 'Please complete the investment questionnaire to get personalized recommendations.',
        });
        router.push('/screens/investment-questionnaire');
        return;
      }

      // Get user profile for context
      console.log('Fetching user profiles...');
      const userProfiles = await api.fetchUserProfiles();
      console.log('User profiles received:', userProfiles);
      let userProfileData = userProfiles && userProfiles.length > 0 ? userProfiles[0] : null;

      // Continue even if profile is not found, but log a warning
      if (!userProfileData) {
        console.warn('User profile not found, but questionnaire is completed. Using default profile.');
      }

      // Get investment recommendations using the AI service
      // Make sure we have a valid user profile to pass to the AI service
      if (!userProfileData) {
        console.warn('User profile not found, creating a default profile based on parameters');
        userProfileData = {
          risk_tolerance: riskLevel === 'high' ? 3 : (riskLevel === 'low' ? 1 : 2),
          investment_experience: 'intermediate',
          investment_timeline: 'mid',
          investment_goals: 'General Investing',
          investment_amount: amount,
        };
      } else {
        // Ensure all required fields are present in the user profile
        if (!userProfileData.risk_tolerance) {
          userProfileData.risk_tolerance = riskLevel === 'high' ? 3 : (riskLevel === 'low' ? 1 : 2);
        }
        if (!userProfileData.investment_experience) {
          userProfileData.investment_experience = 'intermediate';
        }
        if (!userProfileData.investment_timeline) {
          userProfileData.investment_timeline = 'mid';
        }
        if (!userProfileData.investment_goals) {
          userProfileData.investment_goals = 'General Investing';
        }
        if (!userProfileData.investment_amount) {
          userProfileData.investment_amount = amount;
        }
      }

      console.log('Fetching recommendations with pagination, page:', page);

      try {
        // Use the updated API service with pagination support
        const response = await api.getInvestmentRecommendations(
          amount,
          riskLevel,
          page,
          itemsPerPage,
        );

        console.log('Raw API response with pagination:', JSON.stringify(response, null, 2));

        // Handle the API response - could be an array directly, an object with results property (paginated response),
        // or an object with a recommendations property
        const recommendationsArray = Array.isArray(response)
          ? response
          : response && response.results
          ? response.results
          : response && response.recommendations
          ? response.recommendations
          : [];

        if (recommendationsArray && recommendationsArray.length > 0) {
          console.log('Processing', recommendationsArray.length, 'recommendations');

          // Map the recommendations to our UI format
          const formattedRecommendations = recommendationsArray.map((rec: any, index: number) => {
            // Handle fund recommendations from the backend
            if (rec.fund_name && rec.fund_info) {
              return {
                id: `fund-${index}`,
                name: rec.fund_name,
                type: 'Money Market Fund',
                risk_level: rec.fund_info.risk_level <= 3 ? 'low' : (rec.fund_info.risk_level <= 7 ? 'medium' : 'high'),
                expected_return: rec.fund_info.returns,
                time_horizon: rec.fund_info.risk_level <= 3 ? '1-3 years' : (rec.fund_info.risk_level <= 7 ? '3-7 years' : '7+ years'),
                description: rec.fund_info.description,
                min_investment: rec.fund_info.min_investment,
                returns: rec.fund_info.returns,
              };
            } else {
              // Generic recommendation format
              return {
                id: rec.id || `rec-${index}`,
                name: rec.name || rec.fund_name || `Investment Option ${index + 1}`,
                type: rec.type || 'Investment Fund',
                risk_level: rec.risk_level || 'medium',
                expected_return: rec.expected_return || rec.returns || '7-9%',
                time_horizon: rec.time_horizon || '3-5 years',
                description: rec.description || 'No description available',
                min_investment: rec.min_investment || 1000,
              };
            }
          });

          console.log('Setting', formattedRecommendations.length, 'formatted recommendations');
          setRecommendations(formattedRecommendations);
          setCurrentPage(1); // Reset to first page when new recommendations arrive

          Toast.show({
            type: 'success',
            text1: 'Recommendations Ready',
          });
        } else {
          console.warn('No recommendations received from API');

          // Fix for fallback recommendations
          const fallbackRecommendations = [
            {
              id: 'fallback-1',
              name: 'Balanced Portfolio',
              type: 'Mixed Allocation',
              risk_level: 'Medium',
              expected_return: '7-9%',
              time_horizon: '5-7 years',
              description: 'A balanced portfolio with a mix of stocks and bonds, suitable for medium risk tolerance.',
              min_investment: 1000,
              returns: '7-9%',
              allocation: {}, // Add allocation property to fix type error
            },
            {
              id: 'fallback-2',
              name: 'Bond Index Fund',
              type: 'Fixed Income',
              risk_level: 'Medium-Low',
              expected_return: '5-7%',
              time_horizon: '3-5 years',
              description: 'A fund that tracks a bond index, offering moderate returns with lower risk.',
              min_investment: 2000,
              returns: '5-7%',
              allocation: {}, // Add allocation property to fix type error
            },
            {
              id: 'fallback-3',
              name: 'S&P 500 Index Fund',
              type: 'Equity',
              risk_level: 'Medium',
              expected_return: '8-10%',
              time_horizon: '5-10 years',
              description: 'A fund that tracks the S&P 500 index, offering exposure to large US companies.',
              min_investment: 3000,
              returns: '8-10%',
              allocation: {}, // Add allocation property to fix type error
            },
            {
              id: 'fallback-4',
              name: 'Growth Stock Fund',
              type: 'Equity',
              risk_level: 'Medium-High',
              expected_return: '10-12%',
              time_horizon: '7-10 years',
              description: 'A fund focusing on growth stocks with potential for higher returns.',
              min_investment: 5000,
              returns: '10-12%',
              allocation: {}, // Add allocation property to fix type error
            },
            {
              id: 'fallback-5',
              name: 'Aggressive Growth Fund',
              type: 'Equity',
              risk_level: 'High',
              expected_return: '12-15%',
              time_horizon: '10+ years',
              description: 'A high-risk fund targeting maximum growth through aggressive investments.',
              min_investment: 10000,
              returns: '12-15%',
              allocation: {}, // Add allocation property to fix type error
            },
          ];

          setRecommendations(fallbackRecommendations);
          setCurrentPage(1); // Reset to first page when new recommendations arrive
        }
      } catch (error) {
        console.error('Error in API call:', error);
        throw error; // Re-throw to be caught by the outer catch block
      }
    } catch (error: any) {
      console.error('Error in fetchRecommendations:', error);

      // Show error message with more details if available
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch investment recommendations';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });

      // Provide fallback recommendations
      setRecommendations([
        {
          id: 'fallback-1',
          name: 'Balanced Portfolio',
          type: 'Mixed Allocation',
          risk_level: 'Medium',
          expected_return: '7-9%',
          time_horizon: '5-7 years',
          description: 'A balanced portfolio with a mix of stocks and bonds, suitable for medium risk tolerance.',
          min_investment: 1000,
          returns: '7-9%',
          allocation: {}, // Add allocation property to fix type error
        },
        {
          id: 'fallback-2',
          name: 'Bond Index Fund',
          type: 'Fixed Income',
          risk_level: 'Medium-Low',
          expected_return: '5-7%',
          time_horizon: '3-5 years',
          description: 'A fund that tracks a bond index, offering moderate returns with lower risk.',
          min_investment: 2000,
          returns: '5-7%',
          allocation: {}, // Add allocation property to fix type error
        },
        {
          id: 'fallback-3',
          name: 'S&P 500 Index Fund',
          type: 'Equity',
          risk_level: 'Medium',
          expected_return: '8-10%',
          time_horizon: '5-10 years',
          description: 'A fund that tracks the S&P 500 index, offering exposure to large US companies.',
          min_investment: 3000,
          returns: '8-10%',
          allocation: {}, // Add allocation property to fix type error
        },
        {
          id: 'fallback-4',
          name: 'Growth Stock Fund',
          type: 'Equity',
          risk_level: 'Medium-High',
          expected_return: '10-12%',
          time_horizon: '7-10 years',
          description: 'A fund focusing on growth stocks with potential for higher returns.',
          min_investment: 5000,
          returns: '10-12%',
          allocation: {}, // Add allocation property to fix type error
        },
        {
          id: 'fallback-5',
          name: 'Aggressive Growth Fund',
          type: 'Equity',
          risk_level: 'High',
          expected_return: '12-15%',
          time_horizon: '10+ years',
          description: 'A high-risk fund targeting maximum growth through aggressive investments.',
          min_investment: 10000,
          returns: '12-15%',
          allocation: {}, // Add allocation property to fix type error
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getGeminiAnalysis = async (recommendation: Recommendation) => {
    try {
      setGeminiAnalysisLoading(true);
      setSelectedRecommendation(recommendation);

      // If we already have a Gemini analysis, don't fetch again
      if (recommendation.gemini_analysis) {
        return;
      }

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
        const updatedRecommendation = {
          ...recommendation,
          gemini_analysis: geminiResponse.text,
        };

        // Update the selected recommendation
        setSelectedRecommendation(updatedRecommendation);

        // Update the recommendation in the list
        setRecommendations((prevRecommendations) =>
          prevRecommendations.map((rec) =>
            rec.id === recommendation.id ? updatedRecommendation : rec,
          ),
        );
      } else {
        Toast.show({
          type: 'error',
          text1: 'Analysis Failed',
          text2: 'Could not generate analysis for this investment',
        });
      }
    } catch (error) {
      console.error('Error getting Gemini analysis:', error);
      Toast.show({
        type: 'error',
        text1: 'Analysis Error',
        text2: 'Failed to analyze this investment option',
      });
    } finally {
      setGeminiAnalysisLoading(false);
    }
  };

  const fetchAndShowFundDetails = async (recommendation: Recommendation) => {
    if (!recommendation) return;
    
    setFundDetailsLoading(true);
    setSelectedRecommendation(recommendation);
    setSelectedFundDetails(null);
    
    try {
      // Extract fund ID - either from the ID field directly or from the recommendation ID
      const fundId = recommendation.fund_id || recommendation.id;
      console.log('Fetching details for fund ID:', fundId);
      
      const fundDetails = await api.getMarketFundDetails(fundId);
      console.log('Received fund details:', fundDetails);
      
      if (!fundDetails) {
        throw new Error('Could not fetch fund details');
          fundId = searchResponse.data.results[0].id;
        }
      }

      // If we have a fund ID, get the details
      if (fundId) {
        console.log('Fetching fund details for ID:', fundId);
        const response = await api.getMarketFundDetails(fundId);
        fundDetails = response.data;
      }

      if (!fundDetails) {
        throw new Error('Could not find fund details');
      }

      console.log('Fund details loaded:', fundDetails);
      setSelectedFundDetails(fundDetails);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Fund details loaded successfully'
      });
    } catch (error) {
      console.error('Error fetching fund details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch fund details';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage
      });
      setSelectedFundDetails(null);
    } finally {
      setFundDetailsLoading(false);
    }
  };

  const handleSelectRecommendation = (recommendation: Recommendation) => {
    // If it's a market fund, fetch details
    if (recommendation.type && recommendation.type.toLowerCase().includes('fund')) {
      fetchAndShowFundDetails(recommendation);
    } else {
      setSelectedRecommendation(recommendation);
      setSelectedFundDetails(null);
    }
  };

  // Calculate total pages - ensure at least 1 page is shown
  const totalPages = useMemo(() => {
    // If we have a paginated response with a count field, use that for total pages calculation
    if (recommendations.length > 0 && 'count' in recommendations[0]) {
      // Check if the response has a count property (from API pagination)
      const count = (recommendations[0] as any).count;
      if (typeof count === 'number') {
        return Math.max(1, Math.ceil(count / itemsPerPage));
      }
    }
    return Math.max(1, Math.ceil(recommendations.length / itemsPerPage));
  }, [recommendations, itemsPerPage]);

  // Handle page navigation
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      // fetchRecommendations will be called via the useEffect that watches currentPage
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      // fetchRecommendations will be called via the useEffect that watches currentPage
    }
  };

  // Calculate investment returns based on user input
  const calculateInvestmentReturns = (recommendation: Recommendation) => {
    if (!recommendation || !investmentAmount || !investmentYears) return null;

    const amount = parseFloat(investmentAmount);
    const years = parseFloat(investmentYears);

    if (isNaN(amount) || isNaN(years) || amount <= 0 || years <= 0) return null;

    // Extract return rate from expected_return string (e.g., '7-9%' -> 8%)
    let returnRate = 0.08; // Default to 8%

    if (recommendation.expected_return) {
      const returnString = recommendation.expected_return;
      // Parse strings like '7-9%' or '10%'
      const matches = returnString.match(/(\d+)(?:-(\d+))?%/);

      if (matches) {
        if (matches[2]) {
          // Range like '7-9%'
          const min = parseFloat(matches[1]);
          const max = parseFloat(matches[2]);
          returnRate = (min + max) / 200; // Average and convert to decimal
        } else {
          // Single value like '10%'
          returnRate = parseFloat(matches[1]) / 100;
        }
      }
    }

    // Calculate compound interest: A = P(1 + r)^t
    const futureValue = amount * Math.pow(1 + returnRate, years);
    const totalInterest = futureValue - amount;

    return {
      initialInvestment: amount,
      futureValue: futureValue.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
      annualReturn: (returnRate * 100).toFixed(1) + '%',
    };
  };

  // Calculate the current investment results whenever inputs change
  const investmentResults = useMemo(() => {
    if (selectedRecommendation) {
      return calculateInvestmentReturns(selectedRecommendation);
    }
    return null;
  }, [selectedRecommendation, investmentAmount, investmentYears]);

  const handleAddToPortfolio = (recommendation: Recommendation) => {
    Alert.alert(
      'Add to Portfolio',
      `Would you like to add ${recommendation.name} to your investment portfolio?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
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
                amount: amount || 1000, // Use the amount from params or default
                description: recommendation.description,
                asset_class: recommendation.asset_class || recommendation.type,
              };

              // Call API to add investment to portfolio
              await api.addInvestment(investmentData);

              Toast.show({
                type: 'success',
                text1: 'Added to Portfolio',
                text2: `${recommendation.name} has been added to your portfolio`,
              });

              // Navigate to portfolio view
              router.push('/screens/profile?source=investment');
            } catch (error) {
              console.error('Error adding to portfolio:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to add investment to portfolio',
              });
            }
          },
        },
      ],
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
    secondaryText: {
      color: colors.text + '99', // Add transparency for secondary text
    },
    detailsButton: {
      backgroundColor: colors.primary + '20', // Light version of primary color
    },
    detailsButtonText: {
      color: colors.primary,
    },
    divider: {
      backgroundColor: colors.border,
    },
    analysisText: {
      color: colors.text,
    },
  };

  // Calculate investment returns for the selected recommendation - moved to a single declaration

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, dynamicStyles.title]}>Investment Recommendations</Text>
        <TouchableOpacity
          style={[styles.refreshButton, refreshing && styles.refreshingButton]}
          onPress={() => fetchRecommendations(currentPage, true)}
          disabled={loading || refreshing}
        >
          <Ionicons
            name="refresh"
            size={24}
            color={loading || refreshing ? colors.textSecondary : colors.primary}
            style={refreshing ? styles.spinningIcon : undefined}
          />
          {refreshing && <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>Refreshing...</Text>}
        </TouchableOpacity>
      </View>

      {/* User Investment Profile Card (consistent with dashboard) */}
      <View style={[styles.profileCard, { backgroundColor: colors.card }]}> 
        <Text style={[styles.profileCardTitle, { color: colors.text }]}>Your Investment Profile</Text>
        {userProfileLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : userProfile ? (
          <>
            {(() => {
              // Always show the summary fields, even if value is missing (show '-')
              const summaryFields = [
                { label: 'Risk Tolerance', key: 'risk_tolerance' },
                { label: 'Experience', key: 'investment_experience' },
                { label: 'Timeline', key: 'investment_timeline' },
                { label: 'Goals', key: 'investment_goals' },
              ];
              return summaryFields.map((field) => {
                let value = userProfile[field.key];
                if (Array.isArray(value)) value = value.join(', ');
                if (value === undefined || value === null || value === '' || value === '-' || value === 'None' || value === 'none') value = '-';
                return (
                  <View style={styles.profileRow} key={field.key}>
                    <Text style={styles.profileLabel}>{field.label}:</Text>
                    <Text style={styles.profileValue}>{value}</Text>
                  </View>
                );
              });
            })()}
          </>
        ) : (
          <Text style={{ color: colors.textSecondary }}>Profile data unavailable</Text>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, dynamicStyles.text]}>Generating recommendations...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {selectedRecommendation && selectedFundDetails ? (
            // Recommendation details view
            <View style={[styles.detailsContainer, dynamicStyles.card]}>
              <TouchableOpacity
                style={styles.backToListButton}
                onPress={() => { setSelectedRecommendation(null); setSelectedFundDetails(null); }}
              >
                <Ionicons name="arrow-back" size={20} color={colors.primary} />
                <Text style={{ color: colors.primary, marginLeft: 8 }}>Back to recommendations</Text>
              </TouchableOpacity>
              <Text style={[styles.detailsTitle, dynamicStyles.title]}>{selectedFundDetails.name}</Text>
              <View style={styles.detailsRow}>
                <View style={styles.detailsItem}>
                  <Text style={[styles.detailsLabel, dynamicStyles.subtitle]}>Type</Text>
                  <Text style={[styles.detailsValue, dynamicStyles.text]}>{selectedFundDetails.fund_type || selectedFundDetails.type}</Text>
                </View>
                <View style={styles.detailsItem}>
                  <Text style={[styles.detailsLabel, dynamicStyles.subtitle]}>Risk Level</Text>
                  <Text style={[styles.detailsValue, dynamicStyles.text]}>{selectedFundDetails.risk_level}</Text>
                </View>
              </View>
              <Text style={{ marginBottom: 8 }}>{selectedFundDetails.description || 'No description available.'}</Text>
              {selectedFundDetails.website_url && (
                <TouchableOpacity onPress={() => Linking.openURL(selectedFundDetails.website_url)}>
                  <Text style={{ color: colors.primary, textDecorationLine: 'underline', marginBottom: 8 }}>Visit Fund Webpage</Text>
                </TouchableOpacity>
              )}
              <Text>Rate of Return: {selectedFundDetails.rate_of_return || '-'}</Text>
              <Text>Minimum Investment: {selectedFundDetails.minimum_investment || '-'}</Text>
              <Text>Fund Manager: {selectedFundDetails.fund_manager || '-'}</Text>
              <Text>Total Assets: {selectedFundDetails.total_assets ? `KES ${selectedFundDetails.total_assets}` : '-'}</Text>
              <Text>Management Fee: {selectedFundDetails.management_fee || '-'}</Text>
              {/* Add more fields as needed */}
              <Button
                title="Add to Portfolio"
                buttonStyle={[styles.addToPortfolioButton, { backgroundColor: colors.primary }]}
                titleStyle={{ color: colors.background }}
                onPress={() => handleAddToPortfolio(selectedRecommendation)}
              />
            </View>
          ) : selectedRecommendation ? (
            <View style={[styles.detailsContainer, dynamicStyles.card]}>
              <TouchableOpacity
                style={styles.backToListButton}
                onPress={() => setSelectedRecommendation(null)}
              >
                <Ionicons name="arrow-back" size={20} color={colors.primary} />
                <Text style={{ color: colors.primary, marginLeft: 8 }}>Back to recommendations</Text>
              </TouchableOpacity>
              <Text style={[styles.detailsTitle, dynamicStyles.title]}>{selectedRecommendation.name}</Text>
              <View style={styles.detailsRow}>
                <View style={styles.detailsItem}>
                  <Text style={[styles.detailsLabel, dynamicStyles.subtitle]}>Type</Text>
                  <Text style={[styles.detailsValue, dynamicStyles.text]}>{selectedRecommendation.type}</Text>
                </View>
                <View style={styles.detailsItem}>
                  <Text style={[styles.detailsLabel, dynamicStyles.subtitle]}>Risk Level</Text>
                  <Text style={[styles.detailsValue, dynamicStyles.text]}>{selectedRecommendation.risk_level}</Text>
                </View>
              </View>
              {/* Additional details and actions for the selected recommendation */}
              <Button
                title="Add to Portfolio"
                buttonStyle={[styles.addToPortfolioButton, { backgroundColor: colors.primary }]}
                titleStyle={{ color: colors.background }}
                onPress={() => handleAddToPortfolio(selectedRecommendation)}
              />
            </View>
          ) : (
            <>
              {recommendations.length > 0 ? (
                paginatedRecommendations.map((recommendation) => (
                  <TouchableOpacity
                    key={recommendation.id}
                    style={[styles.recommendationItem, dynamicStyles.card]}
                    onPress={() => handleSelectRecommendation(recommendation)}
                  >
                    <View style={styles.recommendationContent}>
                      <Text style={[styles.recommendationTitle, dynamicStyles.title]}>{recommendation.name}</Text>
                      <Text style={[styles.recommendationType, dynamicStyles.subtitle]}>{recommendation.type}</Text>
                      <Text style={[styles.recommendationReturn, dynamicStyles.subtitle]}>
                        Expected Return: {recommendation.expected_return}
                      </Text>
                    </View>
                    <View style={styles.recommendationActions}>
                      <TouchableOpacity
                        style={[styles.detailsButton, dynamicStyles.detailsButton]}
                        onPress={() => handleSelectRecommendation(recommendation)}
                      >
                        <Text style={[styles.detailsButtonText, dynamicStyles.detailsButtonText]}>Details</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={[styles.summaryCard, dynamicStyles.card]}>
                  <Text style={[styles.summaryTitle, dynamicStyles.title]}>No Recommendations</Text>
                  <Text style={[styles.summaryText, dynamicStyles.text]}>
                    We couldn't find any investment recommendations matching your profile. Please complete the investment questionnaire or try again later.
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
      <Toast />
    </View>
  );
};

// Helper function to get risk level text
const getRiskLevelText = (riskTolerance: number): string => {
  if (riskTolerance <= 8) return '#FF9800'; // Orange
  return '#F44336'; // Red
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
  summaryCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  recommendationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recommendationType: {
    fontSize: 14,
    marginBottom: 4,
  },
  recommendationReturn: {
    fontSize: 14,
    marginBottom: 8,
  },
  recommendationActions: {
    justifyContent: 'center',
  },
  detailsButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailsContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  backToListButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
  descriptionContainer: {
    marginBottom: 16,
  },
  descriptionText: {
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
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
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
  spinningIcon: {
    transform: [{ rotate: '45deg' }],
    opacity: 0.7,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  refreshingButton: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  // Profile card styles
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  profileContent: {
    width: '100%',
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  profileItem: {
    flex: 1,
    marginRight: 8,
  },
  profileLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  riskIndicatorContainer: {
    flexDirection: 'row',
    height: 6,
    marginVertical: 6,
  },
  riskIndicator: {
    flex: 1,
    height: 6,
    marginHorizontal: 1,
    borderRadius: 3,
  },
  // Pagination styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  paginationButton: {
    padding: 8,
    borderRadius: 4,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  // Investment calculator styles
  calculatorContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
  },
  resultsContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailsSection: {
    marginVertical: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  detailsGridItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  websiteButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    marginTop: 16,
  },
});

export default InvestmentRecommendationsScreen;
