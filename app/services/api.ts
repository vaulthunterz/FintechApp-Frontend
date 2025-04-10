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

  // Special handling for development mode - adds detailed headers for debugging
  const debugHeaders = {};
  if (process.env.NODE_ENV === 'development') {
    Object.assign(debugHeaders, {
      'X-Debug-Mode': 'true',
      'X-Client-Platform': Platform.OS,
    });
  }

  const config: any = {
    method: method.toLowerCase(),
    url: `${API_BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...debugHeaders,
      'Accept': 'application/json'
    },
    // Enable credentials for proper CORS handling
    withCredentials: true,
  };

  // Validate security-critical aspects
  if (endpoint.includes('/transactions') && !token) {
    console.error("Critical security warning: Attempting to access transactions without a token");
    throw new Error("Authentication required for accessing sensitive data");
  }

  // Print detailed debugging info
  console.log("Token available:", !!token);
  if (token) {
    console.log("Token format check:");
    console.log("- Token length:", token.length);
    console.log("- First 10 chars:", token.substring(0, 10));
    console.log("- Contains dots:", token.includes("."));
    console.log("- JWT format valid:", token.split('.').length === 3);
  }

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
      console.log("Response data preview:",
        Array.isArray(response.data)
          ? `Array with ${response.data.length} items`
          : JSON.stringify(response.data).substring(0, 100) + "..."
      );
    }
    return response.data;
  } catch (error: any) {
    console.error(`${method.toUpperCase()} request failed:`, error.message || error);

    // More detailed error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response status:', error.response.status);
      console.error('Response headers:', JSON.stringify(error.response.headers));
      console.error('Response data:', error.response.data);

      // Check specifically for auth errors
      if (error.response.status === 401 || error.response.status === 403) {
        console.error("Authentication error detected - checking auth state");
        const currentUser = auth.currentUser;
        console.error("Current auth state:", currentUser ? "Logged in" : "Logged out");
        if (currentUser) {
          console.error("User email:", currentUser.email);
          console.error("User ID:", currentUser.uid);

          // Handle authentication errors by attempting to refresh the token
          try {
            console.log("Attempting to refresh token...");
            await currentUser.getIdToken(true);
            console.log("Token refreshed successfully - retrying request");

            // Create new config with fresh token
            const newToken = await currentUser.getIdToken();
            const newConfig = {
              ...config,
              headers: {
                ...config.headers,
                'Authorization': `Bearer ${newToken}`
              }
            };

            // Retry request once with new token
            const retryResponse = await axios(newConfig);
            console.log("Retry succeeded:", retryResponse.status);
            return retryResponse.data;
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
          }
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
      console.error('Network error or server not responding');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
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
export const fetchTransactions = async (page?: number) => {
  const endpoint = page ? `/api/expenses/transactions/?page=${page}` : '/api/expenses/transactions/';
  const response = await apiRequest('get', endpoint);

  // Handle paginated response
  if (response && response.results) {
    return {
      data: response.results,
      pagination: {
        count: response.count,
        next: response.next,
        previous: response.previous,
        totalPages: response.total_pages,
        currentPage: response.current_page,
        pageTotalAmount: response.page_total_amount
      }
    };
  }

  // Fallback for non-paginated response (should not happen after pagination implementation)
  return { data: response, pagination: null };
};

export const getTransactions = async (token: string) => {
  try {
    const response = await apiRequest('get', '/api/expenses/transactions/');
    // Handle paginated response - extract results array
    if (response && response.results) {
      console.log(`Received paginated response with ${response.results.length} transactions`);
      return {
        data: response.results,
        pagination: {
          count: response.count,
          next: response.next,
          previous: response.previous,
          totalPages: response.total_pages,
          currentPage: response.current_page,
          pageTotalAmount: response.page_total_amount
        }
      };
    } else {
      // Fallback for non-paginated response (should not happen after pagination implementation)
      console.warn('Received non-paginated response from transactions API');
      return { data: response };
    }
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};

// Function to get transactions with pagination support
export const getTransactionsWithPagination = async (token: string, endpoint: string = '/api/expenses/transactions/') => {
  try {
    const response = await apiRequest('get', endpoint);
    // Handle paginated response - extract results array
    if (response && response.results) {
      console.log(`Received paginated response with ${response.results.length} transactions from ${endpoint}`);
      return {
        data: response.results,
        pagination: {
          count: response.count,
          next: response.next,
          previous: response.previous,
          totalPages: response.total_pages,
          currentPage: response.current_page,
          pageTotalAmount: response.page_total_amount
        }
      };
    } else {
      // Fallback for non-paginated response
      console.warn('Received non-paginated response from transactions API');
      return { data: response };
    }
  } catch (error) {
    console.error("Error fetching transactions with pagination:", error);
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
  try {
    return await apiRequest('post', '/api/investment/questionnaires/', questionnaireData);
  } catch (error) {
    // If we get a 404, the investment module is not available
    if (error.response && error.response.status === 404) {
      console.log('Investment module is not available, returning mock response');
      // Return a mock response that indicates success but with a maintenance message
      return {
        id: 'mock-id',
        message: 'Investment module is currently under maintenance',
        status: 'maintenance'
      };
    }
    // For other errors, rethrow
    throw error;
  }
};

export const checkQuestionnaireStatus = async () => {
  try {
    // First check if the investment module is available
    try {
      const response = await apiRequest('get', '/api/investment/questionnaires/status/');
      console.log('Questionnaire status response:', response);
      return response;
    } catch (error) {
      // If we get a 404, the investment module is not available
      if (error.response && error.response.status === 404) {
        console.log('Investment module is not available, returning default status');
        // Return a default response that won't block the user
        return {
          isCompleted: false,
          message: 'Investment module is currently under maintenance'
        };
      }
      // For other errors, rethrow
      throw error;
    }
  } catch (error) {
    console.error('Error checking questionnaire status:', error);
    // If there's an error, assume questionnaire is not completed
    // But don't fail silently - log detailed error information
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
    }
    return {
      isCompleted: false,
      error: 'Could not check questionnaire status'
    };
  }
};

interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export const changePassword = async (data: ChangePasswordData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/expenses/change-password/`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getToken()}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
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
  checkQuestionnaireStatus,
  changePassword
};

// Export the API object as default
export default api;