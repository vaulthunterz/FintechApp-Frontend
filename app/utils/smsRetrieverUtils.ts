/**
 * SMS Retriever Utilities
 *
 * This file provides utilities for working with SMS on Android devices using
 * the SMS Retriever API, which is Google's recommended approach.
 */

import { Platform } from 'react-native';
import { PermissionsAndroid } from 'react-native';

// Import SMS Retriever conditionally to avoid web errors
let SmsRetriever: any = null;
if (Platform.OS === 'android') {
  try {
    SmsRetriever = require('react-native-sms-retriever').default;
  } catch (error) {
    console.error('Failed to import react-native-sms-retriever:', error);
  }
}

/**
 * Request SMS permissions
 * @returns {Promise<boolean>} Whether permissions were granted
 */
export const requestSMSPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    console.log('SMS permissions only needed on Android');
    return false;
  }

  try {
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

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("SMS permission granted");
      return true;
    } else {
      console.log("SMS permission denied");
      return false;
    }
  } catch (err) {
    console.error("Error requesting SMS permission:", err);
    return false;
  }
};

/**
 * Get the app signature for SMS Retriever
 * @returns {Promise<string>} The app signature
 */
export const getAppSignature = async (): Promise<string | null> => {
  if (Platform.OS !== 'android') {
    return null;
  }

  // Check if SmsRetriever is available
  if (!SmsRetriever) {
    console.error('SMS Retriever module is not available');
    return null;
  }

  try {
    const signature = await SmsRetriever.getAppSignature();
    console.log('App signature:', signature);
    return signature;
  } catch (error) {
    console.error('Error getting app signature:', error);
    return null;
  }
};

/**
 * Start the SMS Retriever to listen for incoming SMS messages
 * @returns {Promise<string>} The SMS message content
 */
export const startSmsRetriever = async (): Promise<string | null> => {
  if (Platform.OS !== 'android') {
    console.log('SMS Retriever is only available on Android');
    return null;
  }

  // Check if SmsRetriever is available
  if (!SmsRetriever) {
    console.error('SMS Retriever module is not available');
    return null;
  }

  try {
    // Start the SMS Retriever
    const registered = await SmsRetriever.startSmsRetriever();

    if (!registered) {
      console.log('Failed to start SMS Retriever');
      return null;
    }

    console.log('SMS Retriever started successfully');

    // Wait for an SMS message
    const sms = await SmsRetriever.addSmsListener();
    console.log('SMS received:', sms);

    // Clean up the listener
    SmsRetriever.removeSmsListener();

    return sms;
  } catch (error) {
    console.error('Error with SMS Retriever:', error);
    if (SmsRetriever && SmsRetriever.removeSmsListener) {
      SmsRetriever.removeSmsListener();
    }
    return null;
  }
};

/**
 * Extract M-PESA transaction details from an SMS message
 * @param {string} smsMessage The SMS message content
 * @returns {object|null} Extracted transaction details or null if not an M-PESA message
 */
export const extractMpesaTransaction = (smsMessage: string): any | null => {
  if (!smsMessage) return null;

  // Check if it's an M-PESA message
  if (!smsMessage.includes('M-PESA') && !smsMessage.includes('Safaricom')) {
    return null;
  }

  // Extract transaction details using regex
  // This is a simplified example - adjust based on actual M-PESA message format
  const amountMatch = smsMessage.match(/Ksh([0-9,.]+)/);
  const dateMatch = smsMessage.match(/on (\d{1,2}\/\d{1,2}\/\d{2,4})/);
  const timeMatch = smsMessage.match(/at (\d{1,2}:\d{2} [AP]M)/);
  const transactionIdMatch = smsMessage.match(/Transaction ID: ([A-Z0-9]+)/);

  if (!amountMatch) return null;

  return {
    id: transactionIdMatch ? transactionIdMatch[1].trim() : `mpesa-${Date.now()}`,
    amount: amountMatch ? amountMatch[1].trim() : '',
    date: dateMatch ? dateMatch[1].trim() : '',
    time: timeMatch ? timeMatch[1].trim() : '',
    transactionId: transactionIdMatch ? transactionIdMatch[1].trim() : '',
    merchant: extractMerchantName(smsMessage),
    fullMessage: smsMessage
  };
};

/**
 * Extract merchant name from an M-PESA message
 * @param {string} smsMessage The SMS message content
 * @returns {string} The extracted merchant name
 */
const extractMerchantName = (smsMessage: string): string => {
  // This is a simplified example - adjust based on actual M-PESA message format
  if (smsMessage.includes('sent to')) {
    const match = smsMessage.match(/sent to ([A-Za-z0-9\s]+)/);
    return match ? match[1].trim() : 'Unknown Merchant';
  } else if (smsMessage.includes('received from')) {
    const match = smsMessage.match(/received from ([A-Za-z0-9\s]+)/);
    return match ? match[1].trim() : 'Unknown Sender';
  }
  return 'Unknown';
};

/**
 * Start listening for M-PESA SMS messages
 * @param {Function} onTransactionDetected Callback for when a transaction is detected
 * @returns {Promise<void>}
 */
export const listenForMpesaTransactions = async (
  onTransactionDetected: (transaction: any) => void,
  onError: (error: string) => void
): Promise<void> => {
  // Skip on non-Android platforms
  if (Platform.OS !== 'android') {
    onError('SMS Retriever is only available on Android');
    return;
  }

  // Check if SmsRetriever is available
  if (!SmsRetriever) {
    onError('SMS Retriever module is not available');
    return;
  }

  try {
    // Request permissions first
    const hasPermission = await requestSMSPermissions();
    if (!hasPermission) {
      onError('SMS permissions not granted');
      return;
    }

    // Start the SMS Retriever
    const smsMessage = await startSmsRetriever();

    if (smsMessage) {
      // Extract transaction details
      const transaction = extractMpesaTransaction(smsMessage);

      if (transaction) {
        onTransactionDetected(transaction);
      } else {
        onError('SMS received but no M-PESA transaction found');
      }
    } else {
      onError('No SMS received or SMS Retriever failed');
    }
  } catch (error) {
    console.error('Error listening for M-PESA transactions:', error);
    onError(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default {
  requestSMSPermissions,
  getAppSignature,
  startSmsRetriever,
  extractMpesaTransaction,
  listenForMpesaTransactions
};
