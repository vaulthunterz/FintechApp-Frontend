import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import api from '../../services/api';

interface QuestionnaireReminderProps {
  isCompact?: boolean;
}

const QuestionnaireReminder: React.FC<QuestionnaireReminderProps> = ({ isCompact = false }) => {
  const [hasCompletedQuestionnaire, setHasCompletedQuestionnaire] = useState(true);
  
  // Check if the user has completed the questionnaire
  useEffect(() => {
    const checkQuestionnaireStatus = async () => {
      try {
        const response = await api.checkQuestionnaireStatus();
        setHasCompletedQuestionnaire(response.isCompleted);
      } catch (error) {
        console.error('Error checking questionnaire status:', error);
        // If error, assume not completed so the reminder will be shown
        setHasCompletedQuestionnaire(false);
      }
    };
    
    checkQuestionnaireStatus();
  }, []);
  
  // Don't show reminder if questionnaire is completed
  if (hasCompletedQuestionnaire) {
    return null;
  }
  
  const handleStartQuestionnaire = () => {
    router.push('/screens/investment-questionnaire');
  };
  
  return (
    <View style={[styles.container, isCompact ? styles.compactContainer : null]}>
      <View style={styles.content}>
        <Text style={styles.title}>Complete Your Investment Profile</Text>
        <Text style={styles.description}>
          To provide personalized investment recommendations, we need to understand your investment goals and preferences.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handleStartQuestionnaire}
        >
          <Text style={styles.buttonText}>Start Questionnaire</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
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
    color: '#0d47a1',
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#1976d2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default QuestionnaireReminder; 