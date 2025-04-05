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
import Toast from 'react-native-toast-message';
import api from '../services/api';

// Step component
const StepIndicator = ({ steps, currentStep }: { steps: string[], currentStep: number }) => {
  return (
    <View style={styles.stepperContainer}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepWrapper}>
          <View 
            style={[
              styles.stepDot, 
              index <= currentStep ? styles.activeStep : styles.inactiveStep
            ]} 
          >
            <Text style={styles.stepNumber}>{index + 1}</Text>
          </View>
          {index < steps.length - 1 && (
            <View 
              style={[
                styles.stepLine, 
                index < currentStep ? styles.activeStep : styles.inactiveStep
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
  'Risk Profile',
  'Investment Knowledge',
  'Investment Preferences'
];

interface FormData {
  // Financial Situation
  annual_income: string;
  monthly_savings: string;
  emergency_fund: string;
  debt_amount: string;
  
  // Investment Goals
  primary_goal: string;
  target_amount: string;
  years_to_goal: string;
  
  // Risk Profile
  risk_tolerance_score: string;
  market_volatility_comfort: string;
  loss_tolerance: string;
  
  // Investment Knowledge
  investment_knowledge: string;
  
  // Investment Preferences
  preferred_asset_types: string;
  ethical_investing: boolean;
  socially_responsible: boolean;
}

const InvestmentQuestionnaire = () => {
  const params = useLocalSearchParams();
  const isPostSignup = params.isPostSignup === 'true';
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    // Financial Situation
    annual_income: '',
    monthly_savings: '',
    emergency_fund: '',
    debt_amount: '',
    
    // Investment Goals
    primary_goal: '',
    target_amount: '',
    years_to_goal: '',
    
    // Risk Profile
    risk_tolerance_score: '5',
    market_volatility_comfort: '',
    loss_tolerance: '',
    
    // Investment Knowledge
    investment_knowledge: '',
    
    // Investment Preferences
    preferred_asset_types: '',
    ethical_investing: false,
    socially_responsible: false
  });

  // Check if user has already completed the questionnaire
  useEffect(() => {
    const checkQuestionnaireStatus = async () => {
      try {
        // Check if questionnaire has been completed using API
        const response = await api.checkQuestionnaireStatus();
        
        if (response.isCompleted && isPostSignup) {
          Toast.show({
            type: 'info',
            text1: 'Questionnaire already completed',
            text2: 'Redirecting to dashboard'
          });
          router.replace('/');
        }
      } catch (error) {
        console.error('Error checking questionnaire status:', error);
      }
    };

    checkQuestionnaireStatus();
  }, [isPostSignup]);

  const handleChange = (name: keyof FormData, value: string | boolean) => {
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
      // Submit questionnaire data using the API
      await api.submitQuestionnaire(formData);
      
      Toast.show({
        type: 'success',
        text1: 'Success!',
        text2: 'Investment questionnaire submitted successfully!'
      });
      
      // Navigate based on context
      if (isPostSignup) {
        router.replace('/');
      } else {
        router.back();
      }
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
        <Text style={styles.sectionTitle}>Financial Situation</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Annual Income</Text>
          <TextInput
            style={styles.input}
            placeholder="50000"
            keyboardType="numeric"
            value={formData.annual_income}
            onChangeText={(value) => handleChange('annual_income', value)}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Monthly Savings</Text>
          <TextInput
            style={styles.input}
            placeholder="1000"
            keyboardType="numeric"
            value={formData.monthly_savings}
            onChangeText={(value) => handleChange('monthly_savings', value)}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Emergency Fund</Text>
          <TextInput
            style={styles.input}
            placeholder="10000"
            keyboardType="numeric"
            value={formData.emergency_fund}
            onChangeText={(value) => handleChange('emergency_fund', value)}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Debt Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="15000"
            keyboardType="numeric"
            value={formData.debt_amount}
            onChangeText={(value) => handleChange('debt_amount', value)}
          />
        </View>
      </View>
    );
  };

  const renderInvestmentGoals = () => {
    return (
      <View style={styles.formGroup}>
        <Text style={styles.sectionTitle}>Investment Goals</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Primary Investment Goal</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.primary_goal}
              onValueChange={(value) => handleChange('primary_goal', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select a goal" value="" />
              <Picker.Item label="Retirement" value="retirement" />
              <Picker.Item label="Education" value="education" />
              <Picker.Item label="Home Purchase" value="home" />
              <Picker.Item label="Wealth Building" value="wealth_building" />
              <Picker.Item label="Regular Income" value="income" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Target Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="100000"
            keyboardType="numeric"
            value={formData.target_amount}
            onChangeText={(value) => handleChange('target_amount', value)}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Years to Goal</Text>
          <TextInput
            style={styles.input}
            placeholder="10"
            keyboardType="numeric"
            value={formData.years_to_goal}
            onChangeText={(value) => handleChange('years_to_goal', value)}
          />
        </View>
      </View>
    );
  };

  const renderRiskProfile = () => {
    return (
      <View style={styles.formGroup}>
        <Text style={styles.sectionTitle}>Risk Profile</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Risk Tolerance Score (1-10)</Text>
          <TextInput
            style={styles.input}
            placeholder="5"
            keyboardType="numeric"
            value={formData.risk_tolerance_score}
            onChangeText={(value) => handleChange('risk_tolerance_score', value)}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Market Volatility Comfort</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.market_volatility_comfort}
              onValueChange={(value) => handleChange('market_volatility_comfort', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select comfort level" value="" />
              <Picker.Item label="Low - Prefer stability" value="low" />
              <Picker.Item label="Medium - Balanced approach" value="medium" />
              <Picker.Item label="High - Comfortable with volatility" value="high" />
            </Picker>
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Loss Tolerance</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.loss_tolerance}
              onValueChange={(value) => handleChange('loss_tolerance', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select loss tolerance" value="" />
              <Picker.Item label="Low - Can't tolerate losses" value="low" />
              <Picker.Item label="Medium - Can handle moderate losses" value="medium" />
              <Picker.Item label="High - Can handle significant temporary losses" value="high" />
            </Picker>
          </View>
        </View>
      </View>
    );
  };

  const renderInvestmentKnowledge = () => {
    return (
      <View style={styles.formGroup}>
        <Text style={styles.sectionTitle}>Investment Knowledge</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Investment Knowledge Level</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.investment_knowledge}
              onValueChange={(value) => handleChange('investment_knowledge', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select knowledge level" value="" />
              <Picker.Item label="Beginner - New to investing" value="beginner" />
              <Picker.Item label="Intermediate - Some experience" value="intermediate" />
              <Picker.Item label="Advanced - Very experienced" value="advanced" />
            </Picker>
          </View>
        </View>
      </View>
    );
  };

  const renderInvestmentPreferences = () => {
    return (
      <View style={styles.formGroup}>
        <Text style={styles.sectionTitle}>Investment Preferences</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Preferred Asset Types</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.preferred_asset_types}
              onValueChange={(value) => handleChange('preferred_asset_types', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select asset preference" value="" />
              <Picker.Item label="Stocks only" value="stocks" />
              <Picker.Item label="Bonds only" value="bonds" />
              <Picker.Item label="Balanced Portfolio" value="balanced" />
              <Picker.Item label="Real Estate" value="real_estate" />
              <Picker.Item label="Cryptocurrency" value="crypto" />
            </Picker>
          </View>
        </View>
        
        <View style={styles.switchGroup}>
          <Text style={styles.label}>Ethical Investing</Text>
          <Switch
            value={formData.ethical_investing}
            onValueChange={(value) => handleChange('ethical_investing', value)}
            thumbColor={formData.ethical_investing ? '#1976d2' : '#f4f3f4'}
            trackColor={{ false: '#767577', true: '#a2c9f5' }}
          />
        </View>
        
        <View style={styles.switchGroup}>
          <Text style={styles.label}>Socially Responsible Investing</Text>
          <Switch
            value={formData.socially_responsible}
            onValueChange={(value) => handleChange('socially_responsible', value)}
            thumbColor={formData.socially_responsible ? '#1976d2' : '#f4f3f4'}
            trackColor={{ false: '#767577', true: '#a2c9f5' }}
          />
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
        return renderRiskProfile();
      case 3:
        return renderInvestmentKnowledge();
      case 4:
        return renderInvestmentPreferences();
      default:
        return <Text>Unknown step</Text>;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Investment Questionnaire',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {isPostSignup ? "Complete Your Profile" : "Investment Questionnaire"}
          </Text>
          
          <StepIndicator steps={steps} currentStep={activeStep} />
          
          {getStepContent(activeStep)}
          
          <View style={styles.buttonsContainer}>
            <View style={styles.buttonRow}>
              {activeStep > 0 && (
                <TouchableOpacity
                  style={[styles.button, styles.backButton]}
                  onPress={handleBack}
                  disabled={loading}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}
              
              {activeStep < steps.length - 1 ? (
                <TouchableOpacity
                  style={[styles.button, styles.nextButton]}
                  onPress={handleNext}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.submitButton, loading && styles.disabledButton]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Submit</Text>
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
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
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
    color: '#333',
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
    backgroundColor: '#1976d2',
  },
  inactiveStep: {
    backgroundColor: '#bbdefb',
  },
  stepNumber: {
    color: 'white',
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
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
    borderColor: '#1976d2',
  },
  nextButton: {
    backgroundColor: '#1976d2',
    marginLeft: 'auto',
  },
  submitButton: {
    backgroundColor: '#2e7d32',
    marginLeft: 'auto',
  },
  disabledButton: {
    backgroundColor: '#b0bec5',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButtonText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default InvestmentQuestionnaire; 