// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, inMemoryPersistence } from 'firebase/auth';
import { getAnalytics, isSupported } from "firebase/analytics";
import { Platform } from 'react-native';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBVpGPhXiSSWsuzsl7pAmgRh10zotRJHj0",
  authDomain: "expensecategorization-auth.firebaseapp.com",
  projectId: "expensecategorization-auth",
  storageBucket: "expensecategorization-auth.firebasestorage.app",
  messagingSenderId: "294289711933",
  appId: "1:294289711933:web:6edd81a491d7f372f55b54",
  measurementId: "G-P582W6VTY7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set persistence based on platform
const initializePersistence = async () => {
  try {
    if (Platform.OS === 'web') {
      await setPersistence(auth, browserLocalPersistence);
      console.log('Web persistence set to browserLocalPersistence');
    } else {
      await setPersistence(auth, inMemoryPersistence);
      console.log('Mobile persistence set to inMemoryPersistence');
    }
  } catch (error) {
    console.error("Auth persistence error:", error);
  }
};

// Initialize persistence
initializePersistence();

// Initialize Analytics only if supported (web platform)
let analytics = null;
const initAnalytics = async () => {
  if (Platform.OS === 'web') {
    try {
      if (await isSupported()) {
        analytics = getAnalytics(app);
        console.log('Analytics initialized for web');
      }
    } catch (error) {
      console.warn('Analytics not supported:', error);
    }
  }
};

// Initialize analytics
initAnalytics();

// Add a function to handle token refresh with clock skew tolerance
const getTokenWithRetry = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }
      // Force token refresh and add a small delay to account for clock skew
      await new Promise(resolve => setTimeout(resolve, 1000));
      const token = await currentUser.getIdToken(true);
      return token;
    } catch (error) {
      if (i === retries - 1) throw error;
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

// Export named exports
export { auth, analytics, getTokenWithRetry };

// Add a default export to satisfy Expo Router
export default {
  auth,
  analytics,
  getTokenWithRetry
}; 