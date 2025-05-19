// AI Service API
// This file contains functions for interacting with the centralized AI service

import axios from 'axios';
import { getToken, API_BASE_URL } from './apiUtils';

// Helper function to get headers with authentication
const getHeaders = async () => {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Expense AI Service functions
export const getExpensePrediction = async (description: string, merchant: string = '') => {
  try {
    console.log('Getting expense prediction for:', description);
    const url = `${API_BASE_URL}/api/ai/expense/predict/`;
    console.log('Expense prediction URL:', url);

    const response = await axios.post(
      url,
      { description, merchant },
      { headers: await getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting expense prediction:', error);
    throw error;
  }
};

export const getGeminiPrediction = async (description: string) => {
  try {
    console.log('Getting Gemini prediction for:', description);
    const url = `${API_BASE_URL}/api/ai/gemini/predict/`;
    console.log('Gemini prediction URL:', url);

    const response = await axios.post(
      url,
      { description },
      { headers: await getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting Gemini prediction:', error);
    throw error;
  }
};

export const getCustomModelPrediction = async (description: string, merchant: string = '') => {
  try {
    console.log('Getting custom model prediction for:', description);
    const url = `${API_BASE_URL}/api/ai/expense/predict/custom/`;
    console.log('Custom model prediction URL:', url);

    const response = await axios.post(
      url,
      { description, merchant },
      { headers: await getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting custom model prediction:', error);
    throw error;
  }
};

export const retrainCustomModel = async (options: any = {}) => {
  try {
    console.log('Retraining custom model with options:', options);
    const url = `${API_BASE_URL}/api/ai/expense/train/`;
    console.log('Retrain model URL:', url);

    const response = await axios.post(
      url,
      options,
      { headers: await getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error retraining custom model:', error);
    throw error;
  }
};

export const getModelMetrics = async () => {
  try {
    console.log('Getting model metrics');
    const url = `${API_BASE_URL}/api/ai/expense/metrics/`;
    console.log('Model metrics URL:', url);

    const response = await axios.get(
      url,
      { headers: await getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting model metrics:', error);
    throw error;
  }
};

// Investment AI Service functions
export const getInvestmentRecommendations = async (userProfile: any, recommenderType: string = 'advanced') => {
  try {
    console.log('Getting investment recommendations');
    const url = `${API_BASE_URL}/api/ai/investment/predict/`;
    console.log('Investment recommendations URL:', url);

    // Log the request payload for debugging
    console.log('Request payload:', JSON.stringify({
      user_profile: userProfile,
      recommender_type: recommenderType
    }, null, 2));

    const headers = await getHeaders();
    console.log('Request headers:', headers);

    const response = await axios.post(
      url,
      {
        user_profile: userProfile,
        recommender_type: recommenderType
      },
      { headers }
    );
    
    console.log('Investment recommendations response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) { // Add type annotation
    console.error('Error getting investment recommendations:', error);
    
    // Provide more detailed error information
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
      
      // Return a structured error object instead of throwing
      return {
        error: true,
        status: error.response.status,
        message: error.response.data?.error || 'Server error',
        recommendations: [] // Empty recommendations array
      };
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
      return {
        error: true,
        message: 'No response received from server',
        recommendations: [] // Empty recommendations array
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
      return {
        error: true,
        message: error.message || 'Unknown error occurred',
        recommendations: [] // Empty recommendations array
      };
    }
  }
};

export const getPortfolioAnalysis = async (portfolioId: string) => {
  try {
    console.log('Getting portfolio analysis');
    const url = `${API_BASE_URL}/api/ai/investment/analyze/${portfolioId}/`;
    console.log('Portfolio analysis URL:', url);

    const response = await axios.get(
      url,
      { headers: await getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting portfolio analysis:', error);
    throw error;
  }
};

export const getExpenseBasedRecommendations = async (userId: string) => {
  try {
    console.log('Getting expense-based investment recommendations');
    const url = `${API_BASE_URL}/api/ai/investment/expense-recommendations/${userId}/`;
    console.log('Expense-based recommendations URL:', url);

    const response = await axios.get(
      url,
      { headers: await getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting expense-based recommendations:', error);
    throw error;
  }
};

// Gemini AI Service functions
export const getChatbotResponse = async (message: string, context: any[] = []) => {
  try {
    console.log('Getting chatbot response');
    const url = `${API_BASE_URL}/api/ai/gemini/chat/`;
    console.log('Chatbot URL:', url);

    const response = await axios.post(
      url,
      { message, context },
      { headers: await getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting chatbot response:', error);
    throw error;
  }
};

// Create an object with all AI service functions
const aiService = {
  getExpensePrediction,
  getGeminiPrediction,
  getCustomModelPrediction,
  retrainCustomModel,
  getModelMetrics,
  getInvestmentRecommendations,
  getPortfolioAnalysis,
  getExpenseBasedRecommendations,
  getChatbotResponse
};

// Export the AI service object as default
export default aiService;
