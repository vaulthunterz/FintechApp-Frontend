// API service for the app
// This is a mock implementation that will be replaced with actual API calls

import axios from 'axios';
import { auth, getTokenWithRetry } from '../config/firebaseConfig';
import Toast from 'react-native-toast-message';
import { Platform } from 'react-native';

// Base URL for the API - this is different depending on platform
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    // For web, use localhost
    return 'http://localhost:8080';
  } else if (Platform.OS === 'android') {
    // For Android devices, use ngrok URL
    return 'https://fff0-102-0-10-158.ngrok-free.app';
  } else {
    // For iOS
    return 'https://fff0-102-0-10-158.ngrok-free.app';
  }
};

const API_BASE_URL = getBaseUrl();
console.log("Using API base URL:", API_BASE_URL);

// Helper function to get the token
const getToken = async () => {
  try {
    const token = await getTokenWithRetry();
    console.log('Successfully retrieved token');
    return token;
  } catch (error) {
    console.error("Error getting token:", error);
    Toast.show({
      type: 'error',
      text1: 'Authentication Error',
      text2: 'Failed to get authentication token. Please log in again.',
      position: 'bottom',
    });
    throw error;
  }
};

// Function to make API requests with authentication
const apiRequest = async (method: string, endpoint: string, data: any = null) => {
  console.log(`API Request: ${method.toUpperCase()} ${endpoint}`);
  
  let token = null;
  
  // Only get token if not login/register endpoint
  if (!endpoint.includes('/login') && !endpoint.includes('/register')) {
    try {
      token = await getToken();
      if (!token) {
        throw new Error('Authentication token is required');
      }
    } catch (error) {
      console.error("Failed to get authentication token:", error);
      throw error;
    }
  }

  const config: any = {
    method: method.toLowerCase(),
    url: `${API_BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    withCredentials: true,  // Always include credentials
  };

  if (data) {
    config.data = data;
  }

  console.log("Making API request with config:", {
    method: config.method,
    url: config.url,
    headers: { ...config.headers, Authorization: token ? 'Bearer [REDACTED]' : undefined },
    data: config.data
  });

  try {
    const response = await axios(config);
    console.log(`${method.toUpperCase()} request succeeded with status:`, response.status);
    if (response.data) {
      console.log("Response data:", JSON.stringify(response.data, null, 2));
    }
    return response.data;
  } catch (error: any) {
    console.error(`${method.toUpperCase()} request failed:`, error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    handleApiError(error);
    throw error;
  }
};

// Centralized error handling
const handleApiError = (error: any) => {
  console.error('API Error:', error);
  
  let errorMessage = 'An unexpected error occurred';
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Response data:', error.response.data);
    console.error('Response status:', error.response.status);
    
    // Extract error message from different possible formats
    if (error.response.data) {
      if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.response.data.detail) {
        errorMessage = error.response.data.detail;
      } else {
        // Try to convert the entire data object to a string
        try {
          errorMessage = JSON.stringify(error.response.data);
        } catch (e) {
          errorMessage = `Server error: ${error.response.status}`;
        }
      }
    }
  } else if (error.request) {
    // The request was made but no response was received
    console.error('Error request:', error.request);
    errorMessage = 'No response received from server. Please check your network connection.';
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Error message:', error.message);
    errorMessage = error.message || 'Failed to connect to server';
  }
  
  // Show toast notification
  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: errorMessage,
    position: 'bottom',
    visibilityTime: 4000,
  });
};

// API Functions

// Transactions
export const fetchTransactions = async () => {
  return apiRequest('get', '/api/expenses/transactions/');
};

export const getTransactions = async (token: string) => {
  try {
    const response = await apiRequest('get', '/api/expenses/transactions/');
    return { data: response };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};

export const addTransaction = async (transactionData: any) => {
  return apiRequest('post', '/api/expenses/transactions/', transactionData);
};

export const fetchTransaction = async (transactionId: string) => {
  return apiRequest('get', `/api/expenses/transactions/${transactionId}/`);
};

export const getTransactionById = async (id: string, token: string) => {
  try {
    const response = await apiRequest('get', `/api/expenses/transactions/${id}/`);
    return { data: response };
  } catch (error) {
    console.error("Error fetching transaction:", error);
    throw error;
  }
};

export const updateTransaction = async (transactionId: string, transactionData: any) => {
  return apiRequest('put', `/api/expenses/transactions/${transactionId}/`, transactionData);
};

export const deleteTransaction = async (transactionId: string) => {
  if (!transactionId) {
    throw new Error('Transaction ID is required for deletion');
  }
  console.log(`Attempting to delete transaction with ID: ${transactionId}`);
  try {
    const endpoint = `/api/expenses/transactions/${transactionId}/`;
    console.log(`DELETE request to endpoint: ${endpoint}`);
    const result = await apiRequest('delete', endpoint);
    console.log('Transaction deleted successfully');
    return result;
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    throw error;
  }
};

// Categories
export const fetchCategories = async () => {
  try {
    const response = await apiRequest('get', '/api/expenses/categories/');
    
    // Validate response
    if (Array.isArray(response)) {
      // Sanitize category data to ensure they have proper format
      return response.map(category => ({
        id: category.id?.toString() || '',
        name: category.name?.toString() || `Category ${category.id}`,
        // Include any other properties if needed
      }));
    } else {
      console.warn('Unexpected categories response format:', response);
      return [];
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const fetchSubCategories = async (categoryId: string) => {
  try {
    const response = await apiRequest('get', `/api/expenses/subcategories/?category_id=${categoryId}`);
    
    // Validate response
    if (Array.isArray(response)) {
      // Sanitize subcategory data to ensure they have proper format
      return response.map(subcategory => ({
        id: subcategory.id?.toString() || '',
        name: subcategory.name?.toString() || `Subcategory ${subcategory.id}`,
        category_id: categoryId,
        // Include any other properties if needed
      }));
    } else {
      console.warn('Unexpected subcategories response format:', response);
      return [];
    }
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    throw error;
  }
};

export const createCategory = async (categoryData: any) => {
  return apiRequest('post', '/api/expenses/categories/', categoryData);
};

export const updateCategory = async (categoryId: string, categoryData: any) => {
  return apiRequest('put', `/api/expenses/categories/${categoryId}/`, categoryData);
};

export const deleteCategory = async (categoryId: string) => {
  return apiRequest('delete', `/api/expenses/categories/${categoryId}/`);
};

export const createSubcategory = async (categoryId: string, subcategoryData: any) => {
  return apiRequest('post', `/api/expenses/categories/${categoryId}/subcategories/`, subcategoryData);
};

export const updateSubcategory = async (subcategoryId: string, subcategoryData: any) => {
  return apiRequest('put', `/api/expenses/subcategories/${subcategoryId}/`, subcategoryData);
};

export const deleteSubcategory = async (subcategoryId: string) => {
  return apiRequest('delete', `/api/expenses/subcategories/${subcategoryId}/`);
};

// ML Model
const getHeaders = async () => {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const getGeminiPrediction = async (description: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/expenses/predict/gemini/`,
      { description },
      { headers: await getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting Gemini prediction:', error);
    throw error;
  }
};

export const getCustomPrediction = async (description: string, merchant: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/expenses/predict/custom/`,
      { description, merchant },
      { headers: await getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting custom model prediction:', error);
    throw error;
  }
};

export const getCategoryPrediction = async (description: string) => {
  try {
    console.log("Getting prediction for:", description);
    const response = await apiRequest('post', '/api/expenses/predict/', { description });
    console.log("Raw prediction response:", response);
    return response;
  } catch (error) {
    console.error("Prediction API error:", error);
    throw error;
  }
};

export const getCustomModelPrediction = async (description: string) => {
  return apiRequest('post', '/api/expenses/predict/custom/', { description });
};

export const retrainCustomModel = async () => {
  return apiRequest('post', '/api/expenses/model/retrain/');
};

// Chatbot
export const getChatbotResponse = async (message: string) => {
  return apiRequest('post', '/api/expenses/chatbot/', { message });
};

// User Profile (Expenses)
export const fetchUserGeneralProfile = async () => {
  return apiRequest('get', '/api/expenses/user/profile/');
};

export const updateUserGeneralProfile = async (profileData: any) => {
  return apiRequest('put', '/api/expenses/user/profile/', profileData);
};

// Model Metrics
export const getModelMetrics = async () => {
  return apiRequest('get', '/api/expenses/model-metrics/');
};

// Transaction Statistics
export const getTransactionStats = async () => {
  return apiRequest('get', '/api/expenses/transactions/stats/');
};

// Investment functions
export const fetchInvestments = async () => {
  return apiRequest('get', '/api/investment/investments/');
};

export const addInvestment = async (investmentData: any) => {
  return apiRequest('post', '/api/investment/investments/', investmentData);
};

export const fetchInvestment = async (investmentId: string) => {
  return apiRequest('get', `/api/investment/investments/${investmentId}/`);
};

export const updateInvestment = async (investmentId: string, investmentData: any) => {
  return apiRequest('put', `/api/investment/investments/${investmentId}/`, investmentData);
};

export const deleteInvestment = async (investmentId: string) => {
  return apiRequest('delete', `/api/investment/investments/${investmentId}/`);
};

export const getInvestmentRecommendations = async (amount: number, riskLevel: string) => {
  return apiRequest('get', `/api/investment/recommendations/?amount=${amount}&risk_level=${riskLevel}`);
};

export const getInvestmentPerformance = async (investmentId: string) => {
  return apiRequest('get', `/api/investment/investments/${investmentId}/performance/`);
};

export const getPortfolioSummary = async () => {
  return apiRequest('get', '/api/investment/portfolio/summary/');
};

// Investment Profile functions
export const fetchUserProfiles = async () => {
  return apiRequest('get', '/api/investment/profiles/');
};

export const fetchUserProfile = async (profileId: string) => {
  return apiRequest('get', `/api/investment/profiles/${profileId}/`);
};

export const createUserProfile = async (profileData: any) => {
  return apiRequest('post', '/api/investment/profiles/', profileData);
};

export const updateUserProfile = async (profileId: string, profileData: any) => {
  return apiRequest('patch', `/api/investment/profiles/${profileId}/`, profileData);
};

// Investment Questionnaire functions
export const fetchQuestionnaires = async () => {
  return apiRequest('get', '/api/investment/questionnaires/');
};

export const submitQuestionnaire = async (questionnaireData: any) => {
  return apiRequest('post', '/api/investment/questionnaires/', questionnaireData);
};

export const checkQuestionnaireStatus = async () => {
  const response = await apiRequest('get', '/api/investment/questionnaires/');
  return {
    isCompleted: response && response.length > 0,
    data: response,
  };
};

// Create an object with all API functions
const api = {
  fetchTransactions,
  getTransactions,
  addTransaction,
  fetchTransaction,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  fetchCategories,
  fetchSubCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getGeminiPrediction,
  getCustomPrediction,
  getCategoryPrediction,
  getCustomModelPrediction,
  retrainCustomModel,
  getChatbotResponse,
  fetchUserGeneralProfile,
  updateUserGeneralProfile,
  getModelMetrics,
  getTransactionStats,
  fetchInvestments,
  addInvestment,
  fetchInvestment,
  updateInvestment,
  deleteInvestment,
  getInvestmentRecommendations,
  getInvestmentPerformance,
  getPortfolioSummary,
  fetchUserProfiles,
  fetchUserProfile,
  createUserProfile,
  updateUserProfile,
  fetchQuestionnaires,
  submitQuestionnaire,
  checkQuestionnaireStatus
};

// Export the API object as default
export default api; 