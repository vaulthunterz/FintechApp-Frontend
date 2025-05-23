import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Switch
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import api from '../services/api';

// Step component
const StepIndicator = ({ steps, currentStep }: { steps: string[], currentStep: number }) => {
  const { colors } = useTheme();

  // Create dynamic styles based on theme
  const dynamicStyles = {
    activeStep: {
      backgroundColor: colors.primary,
    },
    inactiveStep: {
      backgroundColor: colors.border,
    },
    stepNumber: {
      color: colors.headerText,
    }
  };

  return (
    <View style={styles.stepperContainer}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepWrapper}>
          <View
            style={[
              styles.stepDot,
              index <= currentStep ? [styles.activeStep, dynamicStyles.activeStep] : [styles.inactiveStep, dynamicStyles.inactiveStep]
            ]}
          >
            <Text style={[styles.stepNumber, dynamicStyles.stepNumber]}>{index + 1}</Text>
          </View>
          {index < steps.length - 1 && (
            <View
              style={[
                styles.stepLine,
                index < currentStep ? [styles.activeStep, dynamicStyles.activeStep] : [styles.inactiveStep, dynamicStyles.inactiveStep]
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );
};

const steps = [
  'Financial Situation',
  'Investment Goals',
  'Risk Assessment',
  'Investment Knowledge',
  'Investment Preferences',
  'Additional Information'
];

interface FormData {
  // Financial Situation
  annual_income_range: string;
  monthly_savings_range: string;
  emergency_fund_months: string;
  debt_situation: string;

  // Investment Goals
  primary_goal: string;
  investment_timeframe: string;
  monthly_investment: string;

  // Risk Assessment
  market_drop_reaction: string;
  investment_preference: string;
  loss_tolerance: string;
  risk_comfort_scenario: string;

  // Investment Knowledge & Experience
  investment_knowledge: string;
  investment_experience_years: string;
  previous_investments: string[];

  // Investment Preferences
  preferred_investment_types: string[];
  ethical_preferences: string[];
  sector_preferences: string[];

  // Additional Information
  financial_dependents: string;
  income_stability: string;
  major_expenses_planned: string[];
}

const InvestmentQuestionnaire = () => {
  const params = useLocalSearchParams();
  const isPostSignup = params.isPostSignup === 'true';
  const { user } = useAuth();
  const { colors } = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    // Financial Situation
    annual_income_range: '',
    monthly_savings_range: '',
    emergency_fund_months: '',
    debt_situation: '',

    // Investment Goals
    primary_goal: '',
    investment_timeframe: '',
    monthly_investment: '',

    // Risk Assessment
    market_drop_reaction: '',
    investment_preference: '',
    loss_tolerance: '',
    risk_comfort_scenario: '',

    // Investment Knowledge & Experience
    investment_knowledge: '',
    investment_experience_years: '',
    previous_investments: [],

    // Investment Preferences
    preferred_investment_types: [],
    ethical_preferences: [],
    sector_preferences: [],

    // Additional Information
    financial_dependents: '',
    income_stability: '',
    major_expenses_planned: []
  });

  // Check if user has already completed the questionnaire
  useEffect(() => {
    const checkQuestionnaireStatus = async () => {
      try {
        console.log('Checking questionnaire status...');
        // Check if questionnaire has been completed using API
        const response = await api.checkQuestionnaireStatus();
        console.log('Questionnaire status check result:', response);

        if (response.isCompleted && isPostSignup) {
          Toast.show({
            type: 'info',
            text1: 'Questionnaire already completed',
            text2: 'Redirecting to dashboard'
          });
          router.replace('/');
        }

        // If we got a maintenance message, show it to the user
        if (response.message === 'Investment module is currently under maintenance') {
          Toast.show({
            type: 'info',
            text1: 'Investment Module',
            text2: 'Investment features are currently under maintenance'
          });
        }
      } catch (error) {
        console.error('Error in component when checking questionnaire status:', error);
        // Show a toast but continue with the questionnaire
        Toast.show({
          type: 'error',
          text1: 'Connection issue',
          text2: 'Proceeding with questionnaire setup'
        });
      }
    };

    checkQuestionnaireStatus();
  }, [isPostSignup]);

  const handleChange = (name: keyof FormData, value: string | boolean | string[]) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Basic validation - check if required fields are filled
      const requiredFields = ['annual_income_range', 'investment_timeframe', 'primary_goal', 'risk_comfort_scenario'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        Toast.show({
          type: 'error',
          text1: 'Missing Information',
          text2: 'Please fill in all required fields before submitting.'
        });
        setLoading(false);
        return;
      }
      
      console.log('Submitting questionnaire with data:', formData);
      
      // Submit questionnaire data using the API
      const response = await api.submitQuestionnaire(formData);
      console.log('Questionnaire submission response:', response);

      // Check if we got a maintenance response
      if (response.status === 'maintenance') {
        Toast.show({
          type: 'info',
          text1: 'Questionnaire Saved',
          text2: 'Investment features are currently under maintenance, but your preferences have been saved.'
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Success!',
          text2: 'Investment questionnaire submitted successfully!'
        });

        // Force refresh of questionnaire status and profile data in the app
        try {
          console.log('Refreshing questionnaire status and user profile data...');
          // This will update the status in the API cache
          const [questionnaireStatus, userProfiles] = await Promise.all([
            api.checkQuestionnaireStatus(),
            api.fetchUserProfiles()
          ]);

          console.log('Refreshed data:', { questionnaireStatus, userProfiles });
        } catch (error) {
          console.error('Error refreshing profile data:', error);
          // Non-critical error, don't show to user
        }
      }

      // Navigate to investment dashboard after successful submission
      setTimeout(() => {
        // Extract risk level and investment amount from form data
        const riskLevel = formData.risk_comfort_scenario || 'medium';
        const amountMatch = formData.monthly_investment?.match(/\d+/g);
        const amount = amountMatch ? parseInt(amountMatch[0]) : 1000;
        
        // Navigate to investment dashboard with risk level and amount parameters
        router.push({
          pathname: '/screens/fixed-investment-dashboard',
          params: { riskLevel, amount }
        });
      }, 500);
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to submit questionnaire. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderFinancialSituation = () => {
    return (
      <View style={styles.formGroup}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Understanding Your Financial Situation</Text>
        <Text style={[styles.sectionDescription, dynamicStyles.sectionDescription]}>
          Let's start by understanding your current financial situation. This helps us provide recommendations that fit your circumstances.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, dynamicStyles.label]}>What is your annual income range?</Text>
          <Text style={[styles.helpText, dynamicStyles.helpText]}>Include all sources of income (salary, bonuses, etc.)</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.annual_income_range}
              onValueChange={(value) => handleChange('annual_income_range', value)}
              style={styles.picker}
              dropdownIconColor={colors.text}
              itemStyle={{ color: colors.text }}
            >
              <Picker.Item label="Select your income range" value="" color={colors.text} />
              <Picker.Item label="Less than KSH 3,000,000" value="0-30000" color={colors.text} />
              <Picker.Item label="KSH 3M - KSH 5M" value="30000-50000" color={colors.text} />
              <Picker.Item label="KSH 5M - KSH 8M" value="50000-80000" color={colors.text} />
              <Picker.Item label="KSH 8M - KSH 12M" value="80000-120000" color={colors.text} />
              <Picker.Item label="More than KSH 12M" value="120000+" color={colors.text} />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, dynamicStyles.label]}>How much can you save monthly?</Text>
          <Text style={[styles.helpText, dynamicStyles.helpText]}>This helps us understand your investment capacity</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.monthly_savings_range}
              onValueChange={(value) => handleChange('monthly_savings_range', value)}
              style={styles.picker}
              dropdownIconColor={colors.text}
              itemStyle={{ color: colors.text }}
            >
              <Picker.Item label="Select your monthly savings" value="" color={colors.text} />
              <Picker.Item label="Less than KSH 20,000" value="0-200" color={colors.text} />
              <Picker.Item label="KSH 20K - KSH 50K" value="200-500" color={colors.text} />
              <Picker.Item label="KSH 50K - KSH 100K" value="500-1000" color={colors.text} />
              <Picker.Item label="KSH 100K - KSH 200K" value="1000-2000" color={colors.text} />
              <Picker.Item label="More than KSH 200K" value="2000+" color={colors.text} />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, dynamicStyles.label]}>How much emergency savings do you have?</Text>
          <Text style={[styles.helpText, dynamicStyles.helpText]}>Emergency funds help you handle unexpected expenses</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.emergency_fund_months}
              onValueChange={(value) => handleChange('emergency_fund_months', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select your emergency fund" value="" />
              <Picker.Item label="No emergency fund" value="0" />
              <Picker.Item label="1-3 months of expenses" value="1-3" />
              <Picker.Item label="3-6 months of expenses" value="3-6" />
              <Picker.Item label="6-12 months of expenses" value="6-12" />
              <Picker.Item label="More than 12 months of expenses" value="12+" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, dynamicStyles.label]}>What is your current debt situation?</Text>
          <Text style={[styles.helpText, dynamicStyles.helpText]}>Consider all types of debt (credit cards, loans, mortgages)</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.debt_situation}
              onValueChange={(value) => handleChange('debt_situation', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select your debt situation" value="" />
              <Picker.Item label="No debt" value="none" />
              <Picker.Item label="Low debt (manageable with current income)" value="low" />
              <Picker.Item label="Moderate debt (working on paying off)" value="moderate" />
              <Picker.Item label="High debt (struggling to manage)" value="high" />
              <Picker.Item label="Very high debt (need debt management help)" value="very_high" />
            </Picker>
          </View>
        </View>
      </View>
    );
  };

  const renderInvestmentGoals = () => {
    return (
      <View style={styles.formGroup}>
        <Text style={styles.sectionTitle}>Your Investment Goals</Text>
        <Text style={styles.sectionDescription}>
          Understanding your goals helps us recommend the most suitable investment options for you.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>What is your main financial goal?</Text>
          <Text style={styles.helpText}>Choose the goal that's most important to you right now</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.primary_goal}
              onValueChange={(value) => handleChange('primary_goal', value)}
              style={styles.picker}
              dropdownIconColor="white"
              itemStyle={{ color: 'white' }}
            >
              <Picker.Item label="Select your main goal" value="" color="white" />
              <Picker.Item label="Planning for retirement" value="retirement" />
              <Picker.Item label="Saving for education" value="education" />
              <Picker.Item label="Buying a home" value="home" />
              <Picker.Item label="Growing my wealth" value="wealth_building" />
              <Picker.Item label="Creating passive income" value="passive_income" />
              <Picker.Item label="Building an emergency fund" value="emergency_fund" />
              <Picker.Item label="Saving for a major purchase" value="major_purchase" />
              <Picker.Item label="Other goal" value="other" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>How long do you plan to keep your money invested?</Text>
          <Text style={styles.helpText}>This helps determine suitable investment options</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.investment_timeframe}
              onValueChange={(value) => handleChange('investment_timeframe', value)}
              style={styles.picker}
              dropdownIconColor="white"
              itemStyle={{ color: 'white' }}
            >
              <Picker.Item label="Select your investment timeframe" value="" color="white" />
              <Picker.Item label="Less than 1 year" value="very_short" />
              <Picker.Item label="1-3 years" value="short" />
              <Picker.Item label="3-5 years" value="medium" />
              <Picker.Item label="5-10 years" value="long" />
              <Picker.Item label="More than 10 years" value="very_long" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>How much can you invest monthly?</Text>
          <Text style={styles.helpText}>Regular investing helps build wealth over time</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.monthly_investment}
              onValueChange={(value) => handleChange('monthly_investment', value)}
              style={styles.picker}
              dropdownIconColor="white"
              itemStyle={{ color: 'white' }}
            >
              <Picker.Item label="Select monthly investment amount" value="" color="white" />
              <Picker.Item label="Less than KSH 10,000" value="0-100" />
              <Picker.Item label="KSH 10K - KSH 30K" value="100-300" />
              <Picker.Item label="KSH 30K - KSH 50K" value="300-500" />
              <Picker.Item label="KSH 50K - KSH 100K" value="500-1000" />
              <Picker.Item label="More than KSH 100K" value="1000+" />
            </Picker>
          </View>
        </View>
      </View>
    );
  };

  const renderRiskAssessment = () => {
    return (
      <View style={styles.formGroup}>
        <Text style={styles.sectionTitle}>Understanding Your Risk Comfort</Text>
        <Text style={styles.sectionDescription}>
          These questions help us understand how comfortable you are with investment risk. There are no right or wrong answers!
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>If your investments suddenly dropped in value, what would you do?</Text>
          <Text style={styles.helpText}>This helps us understand your reaction to market changes</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.market_drop_reaction}
              onValueChange={(value) => handleChange('market_drop_reaction', value)}
              style={styles.picker}
              dropdownIconColor="white"
              itemStyle={{ color: 'white' }}
            >
              <Picker.Item label="Select your likely reaction" value="" color="white" />
              <Picker.Item label="Sell all investments immediately" value="sell_all" />
              <Picker.Item label="Sell some investments" value="sell_some" />
              <Picker.Item label="Do nothing and wait it out" value="do_nothing" />
              <Picker.Item label="Buy more while prices are low" value="buy_more" />
              <Picker.Item label="Seek professional advice" value="seek_advice" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Which investment approach appeals to you most?</Text>
          <Text style={styles.helpText}>Different approaches balance safety and growth potential</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.investment_preference}
              onValueChange={(value) => handleChange('investment_preference', value)}
              style={styles.picker}
              dropdownIconColor="white"
              itemStyle={{ color: 'white' }}
            >
              <Picker.Item label="Select your preferred approach" value="" color="white" />
              <Picker.Item label="Guaranteed returns with no risk" value="very_safe" />
              <Picker.Item label="Mostly safe investments with some growth potential" value="conservative" />
              <Picker.Item label="Mix of safe and growth investments" value="balanced" />
              <Picker.Item label="Mostly growth with some risk protection" value="growth" />
              <Picker.Item label="Maximum growth potential with higher risk" value="aggressive" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>What level of investment loss could you tolerate in a year?</Text>
          <Text style={styles.helpText}>Consider your comfort with temporary market declines</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.loss_tolerance}
              onValueChange={(value) => handleChange('loss_tolerance', value)}
              style={styles.picker}
              dropdownIconColor="white"
              itemStyle={{ color: 'white' }}
            >
              <Picker.Item label="Select your loss tolerance" value="" color="white" />
              <Picker.Item label="Less than 5% loss" value="0-5" />
              <Picker.Item label="5% - 10% loss" value="5-10" />
              <Picker.Item label="10% - 20% loss" value="10-20" />
              <Picker.Item label="20% - 30% loss" value="20-30" />
              <Picker.Item label="More than 30% loss" value="30+" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Which investment scenario are you most comfortable with?</Text>
          <Text style={styles.helpText}>Each scenario shows potential gains and losses</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.risk_comfort_scenario}
              onValueChange={(value) => handleChange('risk_comfort_scenario', value)}
              style={styles.picker}
              dropdownIconColor="white"
              itemStyle={{ color: 'white' }}
            >
              <Picker.Item label="Select a scenario" value="" color="white" />
              <Picker.Item label="Potential gain: 5%, Potential loss: 2%" value="scenario_1" />
              <Picker.Item label="Potential gain: 10%, Potential loss: 5%" value="scenario_2" />
              <Picker.Item label="Potential gain: 20%, Potential loss: 12%" value="scenario_3" />
              <Picker.Item label="Potential gain: 30%, Potential loss: 20%" value="scenario_4" />
              <Picker.Item label="Potential gain: 40%, Potential loss: 30%" value="scenario_5" />
            </Picker>
          </View>
        </View>
      </View>
    );
  };

  const renderInvestmentKnowledge = () => {
    return (
      <View style={styles.formGroup}>
        <Text style={styles.sectionTitle}>Your Investment Experience</Text>
        <Text style={styles.sectionDescription}>
          Tell us about your familiarity with investments. This helps us provide appropriate guidance and recommendations.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>How would you describe your investment knowledge?</Text>
          <Text style={styles.helpText}>Be honest - we'll explain everything you need to know</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.investment_knowledge}
              onValueChange={(value) => handleChange('investment_knowledge', value)}
              style={styles.picker}
              dropdownIconColor="white"
              itemStyle={{ color: 'white' }}
            >
              <Picker.Item label="Select your knowledge level" value="" color="white" />
              <Picker.Item label="No knowledge or experience" value="none" color="white" />
              <Picker.Item label="Basic understanding of savings accounts and fixed deposits" value="basic" color="white" />
              <Picker.Item label="Familiar with stocks and mutual funds" value="moderate" color="white" />
              <Picker.Item label="Good understanding of various investment products" value="good" color="white" />
              <Picker.Item label="Expert knowledge of financial markets" value="expert" color="white" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>How long have you been investing?</Text>
          <Text style={styles.helpText}>Include all types of investments</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.investment_experience_years}
              onValueChange={(value) => handleChange('investment_experience_years', value)}
              style={styles.picker}
              dropdownIconColor="white"
              itemStyle={{ color: 'white' }}
            >
              <Picker.Item label="Select your experience" value="" color="white" />
              <Picker.Item label="No experience" value="none" color="white" />
              <Picker.Item label="Less than 2 years" value="0-2" color="white" />
              <Picker.Item label="2-5 years" value="2-5" color="white" />
              <Picker.Item label="5-10 years" value="5-10" color="white" />
              <Picker.Item label="More than 10 years" value="10+" color="white" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Which investments have you used before?</Text>
          <Text style={styles.helpText}>Select all that apply</Text>
          <View style={styles.checkboxGroup}>
            {[
              { label: 'Savings Accounts', value: 'savings' },
              { label: 'Fixed Deposits', value: 'fixed_deposits' },
              { label: 'Government Bonds', value: 'bonds' },
              { label: 'Mutual Funds', value: 'mutual_funds' },
              { label: 'Stocks', value: 'stocks' },
              { label: 'Real Estate', value: 'real_estate' },
              { label: 'Cryptocurrencies', value: 'crypto' },
              { label: 'None of the above', value: 'none' }
            ].map(item => (
              <TouchableOpacity
                key={item.value}
                style={styles.checkboxItem}
                onPress={() => {
                  const currentSelections = [...formData.previous_investments];
                  const index = currentSelections.indexOf(item.value);
                  if (index === -1) {
                    if (item.value === 'none') {
                      handleChange('previous_investments', ['none']);
                    } else {
                      const newSelections = currentSelections.filter(v => v !== 'none');
                      newSelections.push(item.value);
                      handleChange('previous_investments', newSelections);
                    }
                  } else {
                    currentSelections.splice(index, 1);
                    handleChange('previous_investments', currentSelections);
                  }
                }}
              >
                <View style={[
                  styles.checkbox,
                  formData.previous_investments.includes(item.value) && styles.checkboxSelected
                ]}>
                  {formData.previous_investments.includes(item.value) && (
                    <Text style={[styles.checkmark, dynamicStyles.checkmark]}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderInvestmentPreferences = () => {
    return (
      <View style={styles.formGroup}>
        <Text style={styles.sectionTitle}>Your Investment Preferences</Text>
        <Text style={styles.sectionDescription}>
          Tell us about your investment interests and values. This helps us recommend investments that align with your preferences.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>What types of investments interest you?</Text>
          <Text style={styles.helpText}>Select all that you'd like to learn more about</Text>
          <View style={styles.checkboxGroup}>
            {[
              { label: 'Money Market Funds (Very low risk)', value: 'money_market' },
              { label: 'Government Securities (Low risk)', value: 'govt_securities' },
              { label: 'Fixed Deposits (Low risk)', value: 'fixed_deposits' },
              { label: 'Corporate Bonds (Medium risk)', value: 'corporate_bonds' },
              { label: 'Mutual Funds (Various risk levels)', value: 'mutual_funds' },
              { label: 'Stocks (Higher risk)', value: 'stocks' },
              { label: 'Real Estate Investment Trusts (REITs)', value: 'reits' },
              { label: 'Exchange Traded Funds (ETFs)', value: 'etfs' }
            ].map(item => (
              <TouchableOpacity
                key={item.value}
                style={styles.checkboxItem}
                onPress={() => {
                  const currentSelections = [...formData.preferred_investment_types];
                  const index = currentSelections.indexOf(item.value);
                  if (index === -1) {
                    currentSelections.push(item.value);
                  } else {
                    currentSelections.splice(index, 1);
                  }
                  handleChange('preferred_investment_types', currentSelections);
                }}
              >
                <View style={[
                  styles.checkbox,
                  formData.preferred_investment_types.includes(item.value) && styles.checkboxSelected
                ]}>
                  {formData.preferred_investment_types.includes(item.value) && (
                    <Text style={[styles.checkmark, dynamicStyles.checkmark]}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Do you have any ethical investment preferences?</Text>
          <Text style={styles.helpText}>Select causes you'd like your investments to support</Text>
          <View style={styles.checkboxGroup}>
            {[
              { label: 'Environmental sustainability', value: 'environmental' },
              { label: 'Social responsibility', value: 'social' },
              { label: 'Good governance', value: 'governance' },
              { label: 'Clean energy', value: 'clean_energy' },
              { label: 'Healthcare', value: 'healthcare' },
              { label: 'Education', value: 'education' },
              { label: 'No specific preferences', value: 'none' }
            ].map(item => (
              <TouchableOpacity
                key={item.value}
                style={styles.checkboxItem}
                onPress={() => {
                  const currentSelections = [...formData.ethical_preferences];
                  const index = currentSelections.indexOf(item.value);
                  if (index === -1) {
                    if (item.value === 'none') {
                      handleChange('ethical_preferences', ['none']);
                    } else {
                      const newSelections = currentSelections.filter(v => v !== 'none');
                      newSelections.push(item.value);
                      handleChange('ethical_preferences', newSelections);
                    }
                  } else {
                    currentSelections.splice(index, 1);
                    handleChange('ethical_preferences', currentSelections);
                  }
                }}
              >
                <View style={[
                  styles.checkbox,
                  formData.ethical_preferences.includes(item.value) && styles.checkboxSelected
                ]}>
                  {formData.ethical_preferences.includes(item.value) && (
                    <Text style={[styles.checkmark, dynamicStyles.checkmark]}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Which business sectors interest you?</Text>
          <Text style={styles.helpText}>Select sectors you'd like to invest in</Text>
          <View style={styles.checkboxGroup}>
            {[
              { label: 'Technology', value: 'technology' },
              { label: 'Healthcare', value: 'healthcare' },
              { label: 'Financial Services', value: 'financial' },
              { label: 'Consumer Goods', value: 'consumer' },
              { label: 'Real Estate', value: 'real_estate' },
              { label: 'Energy', value: 'energy' },
              { label: 'Manufacturing', value: 'manufacturing' },
              { label: 'No specific preferences', value: 'none' }
            ].map(item => (
              <TouchableOpacity
                key={item.value}
                style={styles.checkboxItem}
                onPress={() => {
                  const currentSelections = [...formData.sector_preferences];
                  const index = currentSelections.indexOf(item.value);
                  if (index === -1) {
                    if (item.value === 'none') {
                      handleChange('sector_preferences', ['none']);
                    } else {
                      const newSelections = currentSelections.filter(v => v !== 'none');
                      newSelections.push(item.value);
                      handleChange('sector_preferences', newSelections);
                    }
                  } else {
                    currentSelections.splice(index, 1);
                    handleChange('sector_preferences', currentSelections);
                  }
                }}
              >
                <View style={[
                  styles.checkbox,
                  formData.sector_preferences.includes(item.value) && styles.checkboxSelected
                ]}>
                  {formData.sector_preferences.includes(item.value) && (
                    <Text style={[styles.checkmark, dynamicStyles.checkmark]}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderAdditionalInformation = () => {
    return (
      <View style={styles.formGroup}>
        <Text style={styles.sectionTitle}>Additional Information</Text>
        <Text style={styles.sectionDescription}>
          These final questions help us provide more personalized recommendations.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Do you have any financial dependents?</Text>
          <Text style={styles.helpText}>People who rely on your financial support</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.financial_dependents}
              onValueChange={(value) => handleChange('financial_dependents', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select number of dependents" value="" />
              <Picker.Item label="No dependents" value="none" />
              <Picker.Item label="1-2 dependents" value="1-2" />
              <Picker.Item label="3-4 dependents" value="3-4" />
              <Picker.Item label="5 or more dependents" value="5+" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>How stable is your income?</Text>
          <Text style={styles.helpText}>Consider your job security and income predictability</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.income_stability}
              onValueChange={(value) => handleChange('income_stability', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select income stability" value="" />
              <Picker.Item label="Very stable income" value="very_stable" />
              <Picker.Item label="Stable income" value="stable" />
              <Picker.Item label="Somewhat stable income" value="somewhat_stable" />
              <Picker.Item label="Unstable income" value="unstable" />
              <Picker.Item label="Very unstable income" value="very_unstable" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Do you have any major expenses planned?</Text>
          <Text style={styles.helpText}>Select all that apply in the next 5 years</Text>
          <View style={styles.checkboxGroup}>
            {[
              { label: 'Home purchase/renovation', value: 'home' },
              { label: 'Education expenses', value: 'education' },
              { label: 'Wedding', value: 'wedding' },
              { label: 'Starting a business', value: 'business' },
              { label: 'Vehicle purchase', value: 'vehicle' },
              { label: 'Medical procedures', value: 'medical' },
              { label: 'Travel', value: 'travel' },
              { label: 'No major expenses planned', value: 'none' }
            ].map(item => (
              <TouchableOpacity
                key={item.value}
                style={styles.checkboxItem}
                onPress={() => {
                  const currentSelections = [...formData.major_expenses_planned];
                  const index = currentSelections.indexOf(item.value);
                  if (index === -1) {
                    if (item.value === 'none') {
                      handleChange('major_expenses_planned', ['none']);
                    } else {
                      const newSelections = currentSelections.filter(v => v !== 'none');
                      newSelections.push(item.value);
                      handleChange('major_expenses_planned', newSelections);
                    }
                  } else {
                    currentSelections.splice(index, 1);
                    handleChange('major_expenses_planned', currentSelections);
                  }
                }}
              >
                <View style={[
                  styles.checkbox,
                  formData.major_expenses_planned.includes(item.value) && styles.checkboxSelected
                ]}>
                  {formData.major_expenses_planned.includes(item.value) && (
                    <Text style={[styles.checkmark, dynamicStyles.checkmark]}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderFinancialSituation();
      case 1:
        return renderInvestmentGoals();
      case 2:
        return renderRiskAssessment();
      case 3:
        return renderInvestmentKnowledge();
      case 4:
        return renderInvestmentPreferences();
      case 5:
        return renderAdditionalInformation();
      default:
        return <Text style={{ color: colors.text }}>Unknown step</Text>;
    }
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
    sectionTitle: {
      color: colors.text,
    },
    sectionDescription: {
      color: colors.text,
    },
    label: {
      color: colors.text,
    },
    helpText: {
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
    button: {
      backgroundColor: colors.primary,
    },
    buttonDisabled: {
      backgroundColor: colors.border,
    },
    buttonText: {
      color: colors.headerText,
    },
    backButton: {
      backgroundColor: 'transparent',
      borderColor: colors.primary,
    },
    backButtonText: {
      color: colors.primary,
    },
    checkbox: {
      borderColor: colors.border,
    },
    checkboxSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkboxLabel: {
      color: colors.text,
    },
    checkmark: {
      color: colors.headerText,
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Stack.Screen
        options={{
          title: 'Investment Questionnaire',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />

      <ScrollView style={styles.scrollView}>
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.title, dynamicStyles.title]}>
            {isPostSignup ? "Complete Your Profile" : "Investment Questionnaire"}
          </Text>

          <StepIndicator steps={steps} currentStep={activeStep} />

          {getStepContent(activeStep)}

          <View style={styles.buttonsContainer}>
            <View style={styles.buttonRow}>
              {activeStep > 0 && (
                <TouchableOpacity
                  style={[styles.button, styles.backButton, dynamicStyles.backButton]}
                  onPress={handleBack}
                  disabled={loading}
                >
                  <Text style={[styles.backButtonText, dynamicStyles.backButtonText]}>Back</Text>
                </TouchableOpacity>
              )}

              {activeStep < steps.length - 1 ? (
                <TouchableOpacity
                  style={[styles.button, styles.nextButton, dynamicStyles.button]}
                  onPress={handleNext}
                  disabled={loading}
                >
                  <Text style={[styles.buttonText, dynamicStyles.buttonText]}>Next</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.submitButton, dynamicStyles.button, loading && dynamicStyles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.headerText} />
                  ) : (
                    <Text style={[styles.buttonText, dynamicStyles.buttonText]}>Submit</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLine: {
    flex: 1,
    height: 2,
  },
  activeStep: {
    // Colors provided by dynamic styles
  },
  inactiveStep: {
    // Colors provided by dynamic styles
  },
  stepNumber: {
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonsContainer: {
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  nextButton: {
    marginLeft: 'auto',
  },
  submitButton: {
    marginLeft: 'auto',
  },
  disabledButton: {
    // Colors provided by dynamic styles
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  checkboxGroup: {
    marginTop: 8,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 10,
  },
  checkboxSelected: {
    // Colors provided by dynamic styles
  },
  checkboxLabel: {
    fontSize: 14,
    flex: 1,
  },
  checkmark: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default InvestmentQuestionnaire;