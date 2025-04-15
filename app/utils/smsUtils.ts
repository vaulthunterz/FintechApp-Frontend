/**
 * SMS Utilities
 *
 * This file provides utilities for working with SMS on Android devices.
 * It handles the conditional import of the react-native-get-sms-android module
 * and provides a wrapper around its functionality.
 */

import { Platform, PermissionsAndroid } from 'react-native';
import Toast from 'react-native-toast-message';

// Define the SMS module interface
interface SMSModule {
  list: (filter: string, failCallback: (error: string) => void, successCallback: (count: number, smsList: string) => void) => void;
}

/**
 * Request SMS permissions
 * @returns {Promise<boolean>} Whether permissions were granted
 */
export const requestSMSPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    console.log('Not on Android, skipping SMS permissions');
    return false;
  }

  try {
    // First check if we already have the permission
    console.log('Checking if we already have SMS permission...');
    const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);

    if (hasPermission) {
      console.log('SMS permission already granted');
      return true;
    }

    console.log('Requesting SMS permission...');
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: "SMS Permission",
        message: "This app needs access to your SMS messages to detect M-PESA transactions.",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK"
      }
    );

    console.log('Permission request result:', granted);

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("SMS permission granted");
      return true;
    } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
      console.log("SMS permission denied by user");
      return false;
    } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      console.log("SMS permission denied with never ask again");
      // Show a message to the user explaining how to enable permissions manually
      Toast.show({
        type: 'error',
        text1: 'Permission Permanently Denied',
        text2: 'Please enable SMS permissions in your device settings',
        position: 'bottom',
        visibilityTime: 4000
      });
      return false;
    } else {
      console.log("SMS permission request returned unknown result:", granted);
      return false;
    }
  } catch (err) {
    console.error("Error requesting SMS permission:", err);
    return false;
  }
};

// Initialize the SMS module
let SmsAndroid: SMSModule | null = null;
let moduleLoadError: any = null;

// Import the mock module
import mockSmsModule from './mockSmsModule';

// ===== IMPORTANT =====
// Flag to enable mock mode for testing
// Set to false in production when the native module is properly linked
// Set to true for testing when the native module is not available
const USE_MOCK_MODULE = true; // CHANGE THIS TO FALSE IN PRODUCTION

// Only try to import the module on Android
if (Platform.OS === 'android') {
  try {
    // First check if the module exists in the project
    console.log('Attempting to load SMS module...');

    if (USE_MOCK_MODULE) {
      // Use the mock module for testing
      console.log('Using mock SMS module for testing');
      SmsAndroid = mockSmsModule;
    } else {
      // Try a different approach to importing the module
      try {
        // First try the standard import
        const smsModule = require('react-native-get-sms-android');
        console.log('SMS module raw import result:', typeof smsModule, smsModule ? 'not null' : 'null');

        if (smsModule) {
          // Check if the module has a default export or is itself the module
          if (smsModule.default) {
            SmsAndroid = smsModule.default;
            console.log('Using default export from SMS module');
          } else {
            SmsAndroid = smsModule;
            console.log('Using direct export from SMS module');
          }
        } else {
          throw new Error('SMS module import returned null');
        }
      } catch (importError) {
        console.warn('Standard import failed, trying alternative import method:', importError);

        // Try an alternative approach - sometimes the module structure is different
        try {
          // Try importing as a global module
          // @ts-ignore
          if (global.SmsAndroid) {
            // @ts-ignore
            SmsAndroid = global.SmsAndroid;
            console.log('Using global.SmsAndroid');
          } else {
            throw new Error('global.SmsAndroid not found');
          }
        } catch (globalError) {
          console.error('Alternative import also failed:', globalError);

          // As a last resort, use the mock module
          console.log('Using mock SMS module as fallback');
          SmsAndroid = mockSmsModule;
        }
      }
    }

    // Log module details for debugging
    console.log('SMS module initialized:', SmsAndroid ? 'Yes' : 'No');
    if (SmsAndroid) {
      console.log('SMS module type:', typeof SmsAndroid);
      console.log('SMS module functions:', Object.keys(SmsAndroid));

      // Check if the module has the required functions
      if (typeof SmsAndroid.list !== 'function') {
        console.error('SMS module does not have list function');
        moduleLoadError = new Error('SMS module does not have list function');
        SmsAndroid = null; // Reset to null since it's not usable
      }
    } else {
      console.error('SMS module loaded but is null or undefined');
      moduleLoadError = new Error('SMS module loaded but is null or undefined');
    }
  } catch (error) {
    console.error('Failed to import SMS module:', error);
    moduleLoadError = error;

    // As a last resort, use the mock module
    console.log('Using mock SMS module after error');
    SmsAndroid = mockSmsModule;
  }
}

// Track if we've checked permissions
let permissionsChecked = false;
let permissionsGranted = false;

/**
 * Check if the SMS module is available
 * @param {boolean} checkPermissions Whether to check permissions
 * @returns {boolean} Whether the SMS module is available
 */
export const isSMSModuleAvailable = (checkPermissions = false): boolean => {
  if (Platform.OS !== 'android') {
    console.log('SMS module not available: Not on Android platform');
    return false;
  }

  if (SmsAndroid === null) {
    console.log('SMS module not available: Module is null', moduleLoadError);
    return false;
  }

  if (typeof SmsAndroid.list !== 'function') {
    console.log('SMS module not available: list function not found', SmsAndroid);
    return false;
  }

  // If we've already checked permissions, return the cached result
  if (checkPermissions) {
    if (permissionsChecked) {
      return permissionsGranted;
    }

    // We'll check permissions when the function is called with checkPermissions=true
    // This is an async operation, so we can't do it here
    // The caller should use requestSMSPermissions() first
    console.log('SMS module available but permissions not checked');
    return true;
  }

  console.log('SMS module is available and ready to use');
  return true;
};

/**
 * Check and request SMS permissions if needed
 * @returns {Promise<boolean>} Whether permissions are granted
 */
export const checkAndRequestSMSPermissions = async (): Promise<boolean> => {
  console.log('Checking SMS module and permissions...');

  // First check if the module is available
  if (!isSMSModuleAvailable(false)) {
    console.error('Cannot request permissions: SMS module is not available');
    if (moduleLoadError) {
      console.error('Module load error:', moduleLoadError);
    }
    return false;
  }

  try {
    console.log('SMS module is available, checking permissions...');

    // Check if we already have permission
    const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);

    if (hasPermission) {
      console.log('SMS permissions already granted');
      permissionsChecked = true;
      permissionsGranted = true;
      return true;
    }

    console.log('SMS permissions not granted, requesting...');

    // Request permission
    const granted = await requestSMSPermissions();
    permissionsChecked = true;
    permissionsGranted = granted;

    console.log('Permission request completed, result:', granted);
    return granted;
  } catch (error) {
    console.error('Error checking SMS permissions:', error);
    return false;
  }
};

/**
 * Read SMS messages from the inbox
 *
 * @param options Options for filtering SMS messages
 * @param onSuccess Callback for successful SMS retrieval
 * @param onError Callback for errors
 */
export const readSMS = async (
  options: {
    minDate?: number;
    maxDate?: number;
    bodyContains?: string;
    box?: 'inbox' | 'sent' | 'draft';
    indexFrom?: number;
    maxCount?: number;
    address?: string;
  },
  onSuccess: (count: number, smsList: any[]) => void,
  onError: (error: string) => void
): Promise<void> => {
  // Check if we're on Android
  if (Platform.OS !== 'android') {
    const errorMsg = 'SMS reading is only available on Android devices';
    console.log(errorMsg);
    onError(errorMsg);
    return;
  }

  // Check if the SMS module is available
  if (!isSMSModuleAvailable(false)) {
    const errorMsg = 'SMS module is not available';
    console.log(errorMsg, moduleLoadError);
    onError(errorMsg + (moduleLoadError ? `: ${moduleLoadError.message}` : ''));

    Toast.show({
      type: 'error',
      text1: 'SMS Error',
      text2: 'SMS reading functionality is not available',
      position: 'bottom'
    });
    return;
  }

  // Check and request permissions if needed
  const hasPermissions = await checkAndRequestSMSPermissions();
  if (!hasPermissions) {
    const errorMsg = 'SMS permissions not granted';
    console.log(errorMsg);
    onError(errorMsg);

    Toast.show({
      type: 'error',
      text1: 'Permission Denied',
      text2: 'SMS reading requires permission to access your messages',
      position: 'bottom'
    });
    return;
  }

  // Default options
  const defaultOptions = {
    box: 'inbox',
    maxCount: 30,
    indexFrom: 0
  };

  // Merge options
  const mergedOptions = { ...defaultOptions, ...options };
  console.log('Reading SMS with options:', mergedOptions);

  // Call the SMS module
  try {
    console.log('Calling SmsAndroid.list...');
    SmsAndroid!.list(
      JSON.stringify(mergedOptions),
      (error: string) => {
        console.error('SMS reading error:', error);
        onError(`SMS reading error: ${error}`);
      },
      (count: number, smsListJson: string) => {
        console.log(`SMS list returned ${count} messages`);
        try {
          if (!smsListJson) {
            console.error('SMS list JSON is empty or null');
            onError('SMS list JSON is empty or null');
            return;
          }

          console.log('Parsing SMS list JSON...');
          const smsList = JSON.parse(smsListJson);
          console.log('SMS list parsed successfully');
          onSuccess(count, smsList);
        } catch (parseError) {
          console.error('Error parsing SMS list:', parseError);
          onError(`Failed to parse SMS list: ${parseError.message}`);
        }
      }
    );
  } catch (error) {
    console.error('Error calling SMS module:', error);
    onError(`Failed to read SMS messages: ${error.message}`);
  }
};

/**
 * Check if the SMS module is properly linked in the native code
 * This can help diagnose issues with the module
 */
export const checkSMSModuleStatus = (): { available: boolean; error: string | null; details: any } => {
  const result = {
    available: false,
    error: null as string | null,
    details: {
      platform: Platform.OS,
      moduleLoaded: SmsAndroid !== null,
      moduleError: moduleLoadError ? moduleLoadError.message : null,
      permissionsChecked,
      permissionsGranted,
      usingMockModule: USE_MOCK_MODULE
    }
  };

  if (Platform.OS !== 'android') {
    result.error = 'Not on Android platform';
    return result;
  }

  if (SmsAndroid === null) {
    result.error = 'SMS module is null';
    if (moduleLoadError) {
      result.error += `: ${moduleLoadError.message}`;
    }
    return result;
  }

  if (typeof SmsAndroid.list !== 'function') {
    result.error = 'SMS module does not have list function';
    return result;
  }

  result.available = true;
  return result;
};

export default {
  isSMSModuleAvailable,
  readSMS,
  requestSMSPermissions,
  checkAndRequestSMSPermissions,
  checkSMSModuleStatus
};
