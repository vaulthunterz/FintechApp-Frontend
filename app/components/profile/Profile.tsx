import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  TextInput,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import ProfileAnalytics from './ProfileAnalytics';

interface ProfileData {
  id?: string;
  risk_tolerance: string | number;
  investment_experience: string;
  investment_timeline: string;
  investment_goals: string;
}

interface ProfileProps {
  isInvestmentPortfolio?: boolean;
}

const Profile: React.FC<ProfileProps> = ({ isInvestmentPortfolio = false }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [questionnaire, setQuestionnaire] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    risk_tolerance: '',
    investment_experience: '',
    investment_timeline: '',
    investment_goals: ''
  });

  // Define the fetchData function outside useEffect so it can be reused
  const fetchData = useCallback(async () => {
      try {
        setLoading(true);
        console.log('Fetching profile, questionnaire, and portfolio data...');

        // Make API calls to get user profile, questionnaire data, and portfolio summary
        const [profileResponse, questionnaireStatus, portfolioSummary] = await Promise.all([
          api.fetchUserProfiles(),
          api.checkQuestionnaireStatus(),
          api.getPortfolioSummary()
        ]);

        console.log('API responses:', { profileResponse, questionnaireStatus, portfolioSummary });

        // Process profile data
        if (profileResponse && profileResponse.length > 0) {
          const userProfile = profileResponse[0];
          console.log('User profile found:', userProfile);

          setProfile(userProfile);
          setFormData({
            risk_tolerance: userProfile.risk_tolerance || '',
            investment_experience: userProfile.investment_experience || '',
            investment_timeline: userProfile.investment_timeline || '',
            investment_goals: userProfile.investment_goals || ''
          });

          // Always show analytics if we have a profile
          setShowAnalytics(true);
        } else {
          console.log("No existing investment profile found, creating one");

          // Create a new profile via API
          try {
            const newProfile = {
              risk_tolerance: 2, // Medium risk as default
              investment_experience: 'beginner',
              investment_timeline: 'mid',
              investment_goals: 'Building wealth for the future'
            };

            const createdProfile = await api.createUserProfile(newProfile);
            console.log('Created new profile:', createdProfile);

            setProfile(createdProfile);
            setFormData({
              risk_tolerance: createdProfile.risk_tolerance,
              investment_experience: createdProfile.investment_experience,
              investment_timeline: createdProfile.investment_timeline,
              investment_goals: createdProfile.investment_goals
            });

            setShowAnalytics(true);

            Toast.show({
              type: 'success',
              text1: 'Profile Created',
              text2: 'Your investment profile has been created',
              position: 'bottom'
            });
          } catch (profileError) {
            console.error('Error creating profile:', profileError);
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'Failed to create investment profile',
              position: 'bottom'
            });
          }
        }

        // Process questionnaire data
        if (questionnaireStatus && questionnaireStatus.isCompleted) {
          console.log('Questionnaire is completed');

          if (questionnaireStatus.data) {
            console.log('Setting questionnaire data');
            setQuestionnaire(questionnaireStatus.data);
          }

          // Set analytics data if available
          if (questionnaireStatus.analytics) {
            console.log('Setting analytics data from questionnaire');
            setAnalytics({
              ...questionnaireStatus.analytics,
              portfolioSummary: portfolioSummary
            });
          } else {
            // Use portfolio data for analytics
            console.log('Using portfolio data for analytics');

            // Calculate risk score based on profile risk tolerance
            const riskScore = typeof profile?.risk_tolerance === 'number'
              ? profile.risk_tolerance * 3
              : 5;

            // Create analytics from portfolio data
            setAnalytics({
              risk_score: riskScore,
              profile_risk_level: typeof profile?.risk_tolerance === 'number' ? profile.risk_tolerance : 2,
              investment_style: getInvestmentStyleFromRisk(profile?.risk_tolerance),
              allocation: getAssetAllocationFromPortfolio(portfolioSummary),
              portfolioSummary: portfolioSummary
            });
          }
        } else {
          console.log('Questionnaire not completed, using portfolio data');

          // Calculate risk score based on profile risk tolerance
          const riskScore = typeof profile?.risk_tolerance === 'number'
            ? profile.risk_tolerance * 3
            : 5;

          // Create analytics from portfolio data
          setAnalytics({
            risk_score: riskScore,
            profile_risk_level: typeof profile?.risk_tolerance === 'number' ? profile.risk_tolerance : 2,
            investment_style: getInvestmentStyleFromRisk(profile?.risk_tolerance),
            allocation: getAssetAllocationFromPortfolio(portfolioSummary),
            portfolioSummary: portfolioSummary
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);

        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load profile data. Please try again.',
          position: 'bottom'
        });
      } finally {
        setLoading(false);
      }
    }, []);

  // Helper function to determine investment style based on risk tolerance
  const getInvestmentStyleFromRisk = (riskTolerance: number | string | undefined): string => {
    if (typeof riskTolerance === 'number') {
      if (riskTolerance === 1) return 'Conservative';
      if (riskTolerance === 2) return 'Balanced';
      if (riskTolerance === 3) return 'Growth';
    }
    return 'Balanced'; // Default
  };

  // Helper function to extract asset allocation from portfolio summary
  const getAssetAllocationFromPortfolio = (portfolioSummary: any): { stocks: number, bonds: number, cash: number } => {
    if (!portfolioSummary || !portfolioSummary.asset_allocation || portfolioSummary.asset_allocation.length === 0) {
      // Default allocation if no portfolio data
      return { stocks: 50, bonds: 30, cash: 20 };
    }

    // Map portfolio asset types to our simplified categories
    let stocks = 0;
    let bonds = 0;
    let cash = 0;

    portfolioSummary.asset_allocation.forEach((asset: any) => {
      const assetType = asset.type.toLowerCase();
      if (assetType.includes('stock') || assetType.includes('equity') || assetType.includes('share')) {
        stocks += asset.percentage;
      } else if (assetType.includes('bond') || assetType.includes('fixed') || assetType.includes('debt')) {
        bonds += asset.percentage;
      } else if (assetType.includes('cash') || assetType.includes('money') || assetType.includes('liquid')) {
        cash += asset.percentage;
      } else {
        // For unknown types, distribute proportionally
        stocks += asset.percentage * 0.5; // 50% to stocks
        bonds += asset.percentage * 0.3;  // 30% to bonds
        cash += asset.percentage * 0.2;   // 20% to cash
      }
    });

    // Normalize to ensure they sum to 100%
    const total = stocks + bonds + cash;
    if (total > 0) {
      stocks = Math.round((stocks / total) * 100);
      bonds = Math.round((bonds / total) * 100);
      cash = 100 - stocks - bonds; // Ensure they sum to exactly 100
    } else {
      // Default if all zeros
      stocks = 50;
      bonds = 30;
      cash = 20;
    }

    return { stocks, bonds, cash };
  };

  // Initial data fetch on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Profile screen focused, refreshing data...');
      fetchData();
      return () => {
        // Cleanup function when screen loses focus (if needed)
      };
    }, [fetchData])
  );

  const handleChange = (name: keyof ProfileData, value: string | number) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.risk_tolerance || !formData.investment_experience || !formData.investment_timeline) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in all required fields'
      });
      return;
    }

    setSaving(true);

    try {
      let updatedProfile;
      if (profile?.id) {
        // Update existing profile
        updatedProfile = await api.updateUserProfile(profile.id, formData);
      } else {
        // Create new profile
        updatedProfile = await api.createUserProfile(formData);
      }

      setProfile(updatedProfile);
      setShowAnalytics(true);

      // Refresh questionnaire status to update analytics
      try {
        const questionnaireStatus = await api.checkQuestionnaireStatus();
        if (questionnaireStatus && questionnaireStatus.isCompleted) {
          if (questionnaireStatus.analytics) {
            setAnalytics(questionnaireStatus.analytics);
          }
          if (questionnaireStatus.data) {
            setQuestionnaire(questionnaireStatus.data);
          }
        }
      } catch (error) {
        console.error('Error refreshing questionnaire data:', error);
        // Non-critical error, don't show to user
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update profile. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  // Create dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: colors.background,
    },
    title: {
      color: colors.text,
    },
    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    sectionTitle: {
      color: colors.text,
    },
    divider: {
      backgroundColor: colors.border,
    },
    label: {
      color: colors.textSecondary,
    },
    infoLabel: {
      color: colors.textSecondary,
    },
    infoValue: {
      color: colors.text,
    },
    debugText: {
      color: colors.textSecondary,
    },
    pickerContainer: {
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    input: {
      borderColor: colors.border,
      backgroundColor: colors.card,
      color: colors.text,
    },
    accountButton: {
      backgroundColor: colors.primary,
    },
    accountButtonText: {
      color: colors.headerText,
    },
    primaryButton: {
      backgroundColor: colors.success,
    },
    dangerButton: {
      backgroundColor: colors.error,
    },
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, dynamicStyles.container]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Add detailed debug logging
  console.log('Profile render state:', {
    showAnalytics,
    hasProfile: !!profile,
    profileData: profile,
    hasQuestionnaire: !!questionnaire,
    questionnaireData: questionnaire,
    hasAnalytics: !!analytics,
    analyticsData: analytics
  });

  return (
    <ScrollView style={[styles.container, dynamicStyles.container]}>
      <Text style={[styles.title, dynamicStyles.title]}>{isInvestmentPortfolio ? 'Your Investment Portfolio' : 'Your Profile'}</Text>

      {/* Always render the analytics component for debugging */}
      {profile ? (
        <ProfileAnalytics
          profile={profile}
          questionnaire={questionnaire}
          analytics={analytics}
        />
      ) : (
        <View style={[styles.debugContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.debugText, dynamicStyles.debugText]}>Profile Analytics would appear here</Text>
          <Text style={[styles.debugText, dynamicStyles.debugText]}>Profile data not loaded yet</Text>
        </View>
      )}

      <View style={[styles.card, dynamicStyles.card]}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Investment Profile</Text>
        <View style={[styles.divider, dynamicStyles.divider]} />

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>Risk Tolerance</Text>
            <View style={[styles.pickerContainer, dynamicStyles.pickerContainer]}>
              <Picker
                selectedValue={formData.risk_tolerance}
                onValueChange={(value) => handleChange('risk_tolerance', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select risk tolerance" value="" />
                <Picker.Item label="Low" value={1} />
                <Picker.Item label="Medium" value={2} />
                <Picker.Item label="High" value={3} />
              </Picker>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>Investment Experience</Text>
            <View style={[styles.pickerContainer, dynamicStyles.pickerContainer]}>
              <Picker
                selectedValue={formData.investment_experience}
                onValueChange={(value) => handleChange('investment_experience', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select experience" value="" />
                <Picker.Item label="Beginner" value="beginner" />
                <Picker.Item label="Intermediate" value="intermediate" />
                <Picker.Item label="Advanced" value="advanced" />
              </Picker>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>Investment Timeline</Text>
            <View style={[styles.pickerContainer, dynamicStyles.pickerContainer]}>
              <Picker
                selectedValue={formData.investment_timeline}
                onValueChange={(value) => handleChange('investment_timeline', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select timeline" value="" />
                <Picker.Item label="Short-term (< 3 years)" value="short" />
                <Picker.Item label="Mid-term (3-10 years)" value="mid" />
                <Picker.Item label="Long-term (> 10 years)" value="long" />
              </Picker>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>Investment Goals</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={formData.investment_goals?.toString()}
              onChangeText={(value) => handleChange('investment_goals', value)}
              placeholder="e.g., Retirement, Education, Home Purchase"
              placeholderTextColor={colors.textSecondary}
            />
          </View>



          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, dynamicStyles.accountButton, saving && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={saving}
            >
              <Text style={[styles.buttonText, dynamicStyles.accountButtonText]}>
                {saving ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={[styles.card, dynamicStyles.card]}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Account Information</Text>
        <View style={[styles.divider, dynamicStyles.divider]} />

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>Email</Text>
            <Text style={[styles.infoValue, dynamicStyles.infoValue]}>{user?.email || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>User ID</Text>
            <Text style={[styles.infoValue, dynamicStyles.infoValue]}>{user?.uid || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Only show investment questionnaire update in investment portfolio view */}
      {isInvestmentPortfolio ? (
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Portfolio Management</Text>
          <View style={[styles.divider, dynamicStyles.divider]} />

          <TouchableOpacity
            style={[styles.accountButton, dynamicStyles.primaryButton]}
            onPress={() => router.push('/screens/investment-questionnaire')}
          >
            <Text style={[styles.accountButtonText, dynamicStyles.accountButtonText]}>Update Investment Questionnaire</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Account management section only shown in regular profile view, not in investment portfolio */}
      {!isInvestmentPortfolio && (
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Account Management</Text>
          <View style={[styles.divider, dynamicStyles.divider]} />

          <TouchableOpacity
            style={[styles.accountButton, dynamicStyles.primaryButton]}
            onPress={() => router.push('/screens/investment-questionnaire')}
          >
            <Text style={[styles.accountButtonText, dynamicStyles.accountButtonText]}>Update Investment Questionnaire</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.accountButton, dynamicStyles.accountButton]}
            onPress={() => router.push('/screens/change-password')}
          >
            <Text style={[styles.accountButtonText, dynamicStyles.accountButtonText]}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.accountButton, dynamicStyles.dangerButton]}
            onPress={() => {
              // Show confirmation dialog before deleting account
              Alert.alert(
                'Delete Account',
                'Are you sure you want to delete your account? This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      // Implement account deletion logic here
                      Toast.show({
                        type: 'info',
                        text1: 'Feature Coming Soon',
                        text2: 'Account deletion will be available in a future update.'
                      });
                    }
                  }
                ]
              );
            }}
          >
            <Text style={[styles.accountButtonText, dynamicStyles.accountButtonText]}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  form: {
    width: '100%',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  accountButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  accountButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dangerButton: {
    // Styles will be provided by dynamic styles
  },
  primaryButton: {
    // Styles will be provided by dynamic styles
  },
  dangerButtonText: {
    // Styles will be provided by dynamic styles
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        marginBottom: 0,
      },
    }),
  },
  picker: {
    height: 50,
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 50,
  },
  buttonContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#b0bec5',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoContainer: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    width: 100,
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
  },
  debugContainer: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  debugText: {
    fontSize: 14,
    marginBottom: 4,
  },
});

export default Profile;