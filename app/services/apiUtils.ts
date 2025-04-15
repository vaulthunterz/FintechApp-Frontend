// API utilities shared between services
import { Platform } from 'react-native';
import { getTokenWithRetry } from '../config/firebaseConfig';
import Toast from 'react-native-toast-message';

// Base URL for the API - this is different depending on platform
export const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    // For web, use localhost
    return 'http://localhost:8080';
  } else if (Platform.OS === 'android') {
    // For Android devices, use ngrok URL
    return 'https://c34f-102-0-10-158.ngrok-free.app';
  } else {
    // For iOS
    return 'https://fff0-102-0-10-158.ngrok-free.app';
  }
};

export const API_BASE_URL = getBaseUrl();
console.log("Using API base URL:", API_BASE_URL);

// Helper function to get the token
export const getToken = async () => {
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
