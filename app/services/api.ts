// API service for the app
// This is a mock implementation that will be replaced with actual API calls

import axios from 'axios';
import { auth } from '../config/firebaseConfig';
import Toast from 'react-native-toast-message';
import { Platform } from 'react-native';

// Import shared API utilities
import { API_BASE_URL, getToken } from './apiUtils';

// Import AI service functions - using a function to avoid circular dependency
let aiServiceModule: any = null;
const getAIService = () => {
  if (!aiServiceModule) {
    aiServiceModule = require('./aiService').default;
  }
  return aiServiceModule;
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

  // Ensure the endpoint starts with a slash and doesn't contain the token
  let normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Check if the endpoint contains the token (which would be a mistake)
  if (token && normalizedEndpoint.includes(token)) {
    console.error('ERROR: Token found in URL path. Removing token from URL.');
    // Remove the token from the endpoint
    const tokenPattern = new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    normalizedEndpoint = normalizedEndpoint.replace(tokenPattern, '');
    console.log('Cleaned endpoint:', normalizedEndpoint);
  }

  // Construct the full URL, ensuring there are no double slashes
  const url = `${API_BASE_URL}${normalizedEndpoint}`;
  console.log('Constructed URL:', url);

  // Validate URL
  try {
    new URL(url); // This will throw if URL is invalid
    console.log('URL is valid');
  } catch (urlError: any) { // Add type annotation
    console.error('Invalid URL constructed:', url, urlError);
    throw new Error(`Invalid URL: ${url} - ${urlError.message}`);
  }

  const config: any = {
    method: method.toLowerCase(),
    url: url,
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

  // Store the config in a local variable to use in error handling
  let requestConfig = config;

  try {
    const response = await axios(requestConfig);
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
              ...requestConfig,
              headers: {
                ...requestConfig.headers,
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

export const getTransactions = async () => {
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
export const getTransactionsWithPagination = async (endpoint: string = '/api/expenses/transactions/') => {
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

export const getTransactionById = async (id: string) => {
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
    console.log('Fetching categories from API');
    const response = await apiRequest('get', '/api/expenses/categories/');
    console.log('Raw categories response:', response);

    // Validate response
    if (Array.isArray(response)) {
      // Sanitize category data to ensure they have proper format
      const processedCategories = response.map(category => ({
        id: category.id?.toString() || '',
        name: category.name?.toString() || `Category ${category.id}`,
        // Include any other properties if needed
      }));
      console.log('Processed categories:', processedCategories);
      return processedCategories;
    } else if (response && response.results && Array.isArray(response.results)) {
      // Handle paginated response
      console.log('Received paginated categories response');
      const processedCategories = response.results.map(category => ({
        id: category.id?.toString() || '',
        name: category.name?.toString() || `Category ${category.id}`,
      }));
      console.log('Processed categories from paginated response:', processedCategories);
      return processedCategories;
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
    console.log(`Fetching subcategories for category ID: ${categoryId}`);
    // Try the correct endpoint format
    const response = await apiRequest('get', `/api/expenses/subcategory-lookup/?category=${categoryId}`);
    console.log('Subcategories response:', response);

    // Validate response
    if (Array.isArray(response)) {
      // Sanitize subcategory data to ensure they have proper format
      const processedData = response.map(subcategory => ({
        id: subcategory.id?.toString() || '',
        name: subcategory.name?.toString() || `Subcategory ${subcategory.id}`,
        category_id: categoryId,
        // Include any other properties if needed
      }));
      console.log('Processed subcategories:', processedData);
      return processedData;
    } else if (response && response.results && Array.isArray(response.results)) {
      // Handle paginated response
      console.log('Received paginated subcategories response');
      const processedData = response.results.map(subcategory => ({
        id: subcategory.id?.toString() || '',
        name: subcategory.name?.toString() || `Subcategory ${subcategory.id}`,
        category_id: categoryId,
      }));
      console.log('Processed subcategories from paginated response:', processedData);
      return processedData;
    } else {
      console.warn('Unexpected subcategories response format:', response);
      return [];
    }
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    // Try fallback endpoint if the first one fails
    try {
      console.log(`Trying fallback endpoint for subcategories with category ID: ${categoryId}`);
      const fallbackResponse = await apiRequest('get', `/api/expenses/subcategories/?category=${categoryId}`);
      console.log('Fallback subcategories response:', fallbackResponse);

      if (Array.isArray(fallbackResponse)) {
        const processedData = fallbackResponse.map(subcategory => ({
          id: subcategory.id?.toString() || '',
          name: subcategory.name?.toString() || `Subcategory ${subcategory.id}`,
          category_id: categoryId,
        }));
        console.log('Processed subcategories from fallback:', processedData);
        return processedData;
      } else if (fallbackResponse && fallbackResponse.results && Array.isArray(fallbackResponse.results)) {
        // Handle paginated response
        console.log('Received paginated subcategories response from fallback');
        const processedData = fallbackResponse.results.map(subcategory => ({
          id: subcategory.id?.toString() || '',
          name: subcategory.name?.toString() || `Subcategory ${subcategory.id}`,
          category_id: categoryId,
        }));
        console.log('Processed subcategories from paginated fallback response:', processedData);
        return processedData;
      }
      return [];
    } catch (fallbackError) {
      console.error('Error fetching subcategories from fallback endpoint:', fallbackError);
      return [];
    }
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



// AI-related functions now use the centralized AI service (aiService.ts)
export const getGeminiPrediction = async (description: string) => {
  const aiService = getAIService();
  return aiService.getGeminiPrediction(description);
};

export const getCustomPrediction = async (description: string, merchant: string) => {
  const aiService = getAIService();
  return aiService.getCustomModelPrediction(description, merchant);
};

export const getCategoryPrediction = async (description: string) => {
  try {
    console.log("Getting prediction for:", description);
    const aiService = getAIService();
    const response = await aiService.getExpensePrediction(description);
    console.log("Raw prediction response:", response);
    return response;
  } catch (error) {
    console.error("Prediction API error:", error);
    throw error;
  }
};

export const getCustomModelPrediction = async (description: string) => {
  const aiService = getAIService();
  return aiService.getCustomModelPrediction(description);
};

export const retrainCustomModel = async () => {
  const aiService = getAIService();
  return aiService.retrainCustomModel();
};

// Chatbot
export const getChatbotResponse = async (message: string) => {
  const aiService = getAIService();
  return aiService.getChatbotResponse(message);
};

// User Profile (General)
export const fetchUserGeneralProfile = async () => {
  try {
    // Try to get user data from the investment profiles endpoint
    const profilesResponse = await apiRequest('get', '/api/investment/profiles/');
    console.log('User profiles response:', profilesResponse);

    // Handle paginated response
    if (profilesResponse && profilesResponse.results && Array.isArray(profilesResponse.results) && profilesResponse.results.length > 0) {
      // Return the user data from the first profile
      const profile = profilesResponse.results[0];
      console.log('Found user profile:', profile);

      if (profile.user) {
        // Add the profile data to the user object
        const userData = {
          ...profile.user,
          profile: {
            risk_tolerance: profile.risk_tolerance,
            investment_experience: profile.investment_experience,
            investment_timeline: profile.investment_timeline,
            investment_goals: profile.investment_goals
          }
        };
        console.log('Returning user data with profile:', userData);
        return userData;
      }
      return profile.user;
    }
    // Handle non-paginated array response
    else if (Array.isArray(profilesResponse) && profilesResponse.length > 0) {
      // Return the user data from the first profile
      const profile = profilesResponse[0];
      console.log('Found user profile (non-paginated):', profile);

      if (profile.user) {
        // Add the profile data to the user object
        const userData = {
          ...profile.user,
          profile: {
            risk_tolerance: profile.risk_tolerance,
            investment_experience: profile.investment_experience,
            investment_timeline: profile.investment_timeline,
            investment_goals: profile.investment_goals
          }
        };
        console.log('Returning user data with profile:', userData);
        return userData;
      }
      return profile.user;
    } else {
      // If no profiles, try to get the current user data from auth endpoint
      try {
        const response = await apiRequest('get', '/api/auth/user/');
        console.log('User data from auth endpoint:', response);
        return response;
      } catch (authError) {
        console.error('Error fetching user data from auth endpoint:', authError);
        // Return a default user object
        return { username: 'User', email: 'user@example.com' };
      }
    }
  } catch (error) {
    console.error('Error fetching user profiles:', error);
    // Return a default user object
    return { username: 'User', email: 'user@example.com' };
  }
};

export const updateUserGeneralProfile = async (profileData: any) => {
  try {
    console.log('Updating user profile with data:', profileData);
    return apiRequest('put', '/api/expenses/user/', profileData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Model Metrics
export const getModelMetrics = async () => {
  const aiService = getAIService();
  return aiService.getModelMetrics();
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
  // Create a simple user profile object with the amount and risk level
  const userProfile = {
    amount: amount,
    risk_level: riskLevel
  };

  // Use the AI service to get recommendations
  const aiService = getAIService();
  return aiService.getInvestmentRecommendations(userProfile);
};

export const getInvestmentPerformance = async (investmentId: string) => {
  return apiRequest('get', `/api/investment/investments/${investmentId}/performance/`);
};

export const getPortfolioSummary = async () => {
  try {
    // First try to get the portfolio summary from the regular API
    const response = await apiRequest('get', '/api/investment/portfolio/summary/');

    // If successful, try to enhance it with AI analysis
    try {
      if (response && response.data && response.data.id) {
        const aiService = getAIService();
        const aiAnalysis = await aiService.getPortfolioAnalysis(response.data.id);
        // Merge the AI analysis with the regular portfolio data
        return {
          ...response.data,
          risk_assessment: aiAnalysis.risk_assessment,
          diversification_score: aiAnalysis.diversification_score,
          improvement_suggestions: aiAnalysis.improvement_suggestions
        };
      }
      return response.data;
    } catch (aiError) {
      console.error('Error getting AI portfolio analysis:', aiError);
      // Return the regular data if AI analysis fails
      return response.data;
    }
  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    // Return a default portfolio structure if the API fails
    return {
      total_invested: 0,
      current_value: 0,
      returns: 0,
      returns_percentage: 0,
      asset_allocation: [
        { type: 'Stocks', percentage: 60, value: 0 },
        { type: 'Bonds', percentage: 30, value: 0 },
        { type: 'Cash', percentage: 10, value: 0 }
      ]
    };
  }
};

// Investment Profile functions
export const fetchUserProfiles = async () => {
  return apiRequest('get', '/api/investment/profiles/');
};

export const fetchUserProfile = async (profileId: string) => {
  return apiRequest('get', `/api/investment/profiles/${profileId}/`);
};

export const createUserProfile = async (profileData: any) => {
  try {
    const response = await apiRequest('post', '/api/investment/profiles/', profileData);
    return response.data;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
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
  } catch (error: any) { // Add type annotation
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
    // If we get a 401, the user is not authenticated
    if (error.response && error.response.status === 401) {
      console.log('User not authenticated, returning error response');
      return {
        id: 'auth-error',
        message: 'Authentication required',
        status: 'error'
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
    } catch (error: any) { // Add type annotation
      // If we get a 404, the investment module is not available
      if (error.response && error.response.status === 404) {
        console.log('Investment module is not available, returning default status');
        // Return a default response that won't block the user
        return {
          isCompleted: false,
          message: 'Investment module is currently under maintenance'
        };
      }
      // If we get a 401, the user is not authenticated
      if (error.response && error.response.status === 401) {
        console.log('User not authenticated, returning default status');
        // Return a default response that won't block the user
        return {
          isCompleted: false,
          message: 'Authentication required'
        };
      }
      // For other errors, rethrow
      throw error;
    }
  } catch (error: any) { // Add type annotation
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
    // Ensure proper URL construction
    const url = `${API_BASE_URL}/api/expenses/change-password/`;
    console.log('Change password URL:', url);

    const response = await axios.post(
      url,
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
  getTransactionsWithPagination,
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