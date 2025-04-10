import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';

interface QuestionnaireReminderProps {
  isCompact?: boolean;
}

const QuestionnaireReminder: React.FC<QuestionnaireReminderProps> = ({ isCompact = false }) => {
  const { colors } = useTheme();
  const [hasCompletedQuestionnaire, setHasCompletedQuestionnaire] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if the user has completed the questionnaire
  // Use useFocusEffect to re-check when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const checkQuestionnaireStatus = async () => {
        setIsLoading(true);
        try {
          const response = await api.checkQuestionnaireStatus();
          console.log('Questionnaire status:', response);
          setHasCompletedQuestionnaire(response.isCompleted);
        } catch (error) {
          console.error('Error checking questionnaire status:', error);
          // If error, assume not completed so the reminder will be shown
          setHasCompletedQuestionnaire(false);
        } finally {
          setIsLoading(false);
        }
      };

      checkQuestionnaireStatus();

      // Cleanup function
      return () => {
        // Any cleanup if needed
      };
    }, [])
  );

  // Show loading indicator while checking status
  if (isLoading) {
    return null; // Don't show anything while loading
  }

  // Don't show reminder if questionnaire is completed
  if (hasCompletedQuestionnaire) {
    return null;
  }

  const handleStartQuestionnaire = () => {
    router.push('/screens/investment-questionnaire');
  };

  // Create dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: colors.primary + '20', // Light version of primary color
      borderLeftColor: colors.primary,
    },
    title: {
      color: colors.primary,
    },
    description: {
      color: colors.text,
    },
    button: {
      backgroundColor: colors.primary,
    },
    buttonText: {
      color: '#ffffff',
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container, isCompact ? styles.compactContainer : null]}>
      <View style={styles.content}>
        <Text style={[styles.title, dynamicStyles.title]}>Complete Your Investment Profile</Text>
        <Text style={[styles.description, dynamicStyles.description]}>
          To provide personalized investment recommendations, we need to understand your investment goals and preferences.
        </Text>
        <TouchableOpacity
          style={[styles.button, dynamicStyles.button]}
          onPress={handleStartQuestionnaire}
        >
          <Text style={[styles.buttonText, dynamicStyles.buttonText]}>Start Questionnaire</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  compactContainer: {
    padding: 12,
    marginBottom: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default QuestionnaireReminder;