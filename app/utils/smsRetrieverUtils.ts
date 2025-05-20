/**
 * SMS Retriever Utilities
 *
 * This file provides utilities for working with SMS on Android devices using
 * the SMS Retriever API, which is Google's recommended approach.
 */

import { PermissionsAndroid, Platform } from 'react-native';
import { MPESATransaction } from '../types/transaction';
import SmsRetrieverModule from 'react-native-sms-retriever';

interface SmsEvent {
  message: string;
  status?: string;
}

interface SmsRetrieverType {
  startSmsRetriever: () => Promise<boolean>;
  getAppSignature: () => Promise<string>;
  addSmsListener: (callback: (event: { message: string | undefined }) => void) => void;
  removeSmsListener: () => void;
}

// Import SMS Retriever conditionally to avoid web errors
let SmsRetriever: SmsRetrieverType | null = null;
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
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: "SMS Permission",
          message: "We need access to your SMS messages to scan for M-PESA transactions.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Error requesting SMS permissions:', err);
      return false;
    }
  }
  return false;
};

/**
 * Get the app signature for SMS Retriever
 * @returns {Promise<string>} The app signature
 */
export const getAppSignature = async (): Promise<string | null> => {
  if (Platform.OS === 'android' && SmsRetriever) {
    try {
      return await SmsRetriever.getAppSignature();
    } catch (error) {
      console.error('Error getting app signature:', error);
      return null;
    }
  }
  return null;
};

/**
 * Start the SMS Retriever to listen for incoming SMS messages
 * @returns {Promise<string>} The SMS message content
 */
export const startSmsRetriever = async (): Promise<string | null> => {
  if (Platform.OS !== 'android' || !SmsRetriever) {
    console.log('SMS Retriever is only available on Android');
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

    return new Promise((resolve) => {
      if (!SmsRetriever) {
        resolve(null);
        return;
      }

      const listener = (event: { message: string | undefined }) => {
        // Clean up the listener
        SmsRetriever.removeSmsListener();
        resolve(event.message || null);
      };

      // Add listener for SMS
      SmsRetriever.addSmsListener(listener);
    });
  } catch (error) {
    console.error('Error with SMS Retriever:', error);
    if (SmsRetriever) {
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

  try {
    // Different regex patterns for different transaction types
    const patterns = {
      // Send Money: "RK84S84E9Q Confirmed. Ksh100.00 sent to ALICE  KIRUMBA 0724841373 on 8/11/23 at 6:06 PM"
      sendMoney: /([A-Z0-9]+)\s+Confirmed\.\s+Ksh([\d,.]+)\s+sent to\s+([\w\s]+)(?:\s+(\d+))?\s+on\s+(\d{1,2}\/\d{1,2}\/\d{2})\s+at\s+(\d{1,2}:\d{2}\s*[AP]M)/i,
      
      // Receive Money: "RKF5FO9JZX Confirmed.You have received Ksh200.00 from JOAN  WANJIRU 0722111111 on 15/11/23 at 6:30 PM"
      receiveMoney: /([A-Z0-9]+)\s+Confirmed\.You have received\s+Ksh([\d,.]+)\s+from\s+([\w\s]+)(?:\s+(\d+))?\s+on\s+(\d{1,2}\/\d{1,2}\/\d{2})\s+at\s+(\d{1,2}:\d{2}\s*[AP]M)/i,
      
      // Pay Merchant: "RKH9KE145P Confirmed. Ksh20.00 sent to Direct Pay Limited for account ATL305935883 on 17/11/23 at 9:24 AM"
      payMerchant: /([A-Z0-9]+)\s+Confirmed\.\s+Ksh([\d,.]+)\s+(?:sent |paid )to\s+([\w\s]+)(?:\s+for account\s+[\w\d]+)?\s+on\s+(\d{1,2}\/\d{1,2}\/\d{2})\s+at\s+(\d{1,2}:\d{2}\s*[AP]M)/i,
      
      // Buy Airtime: "RKC864GB9W confirmed.You bought Ksh100.00 of airtime on 12/11/23 at 5:25 PM"
      buyAirtime: /([A-Z0-9]+)\s+confirmed\.You bought\s+Ksh([\d,.]+)\s+of airtime\s+on\s+(\d{1,2}\/\d{1,2}\/\d{2})\s+at\s+(\d{1,2}:\d{2}\s*[AP]M)/i,
      
      // Withdraw: "RKH5KM5RYR Confirmed.on 17/11/23 at 10:45 AMWithdraw Ksh200.00 from 2038081 - RACHANJO LOGISTICS"
      withdraw: /([A-Z0-9]+)\s+Confirmed\.on\s+(\d{1,2}\/\d{1,2}\/\d{2})\s+at\s+(\d{1,2}:\d{2}\s*[AP]M)Withdraw\s+Ksh([\d,.]+)\s+from\s+([\d\s-]+[\w\s]+)/i
    };

    let transactionDetails = null;

    // Try each pattern until we find a match
    for (const [type, pattern] of Object.entries(patterns)) {
      const match = smsMessage.match(pattern);
      if (match) {
        switch (type) {
          case 'sendMoney':
            transactionDetails = {
              transactionId: match[1],
              amount: match[2].replace(/,/g, ''),
              merchant: match[3].trim(),
              phone: match[4] || '',
              date: match[5],
              time: match[6],
              type: 'SEND_MONEY'
            };
            break;
          case 'receiveMoney':
            transactionDetails = {
              transactionId: match[1],
              amount: match[2].replace(/,/g, ''),
              merchant: match[3].trim(),
              phone: match[4] || '',
              date: match[5],
              time: match[6],
              type: 'RECEIVE_MONEY'
            };
            break;
          case 'payMerchant':
            transactionDetails = {
              transactionId: match[1],
              amount: match[2].replace(/,/g, ''),
              merchant: match[3].trim(),
              date: match[4],
              time: match[5],
              type: 'PAY_MERCHANT'
            };
            break;
          case 'buyAirtime':
            transactionDetails = {
              transactionId: match[1],
              amount: match[2].replace(/,/g, ''),
              merchant: 'SAFARICOM AIRTIME',
              date: match[3],
              time: match[4],
              type: 'BUY_AIRTIME'
            };
            break;
          case 'withdraw':
            transactionDetails = {
              transactionId: match[1],
              date: match[2],
              time: match[3],
              amount: match[4].replace(/,/g, ''),
              merchant: match[5].trim(),
              type: 'WITHDRAW'
            };
            break;
        }
        break; // Exit loop once we find a match
      }
    }

    if (transactionDetails) {
      return {
        ...transactionDetails,
        id: `${Date.now()}-${Math.random()}`,
        fullMessage: smsMessage,
        timestamp: new Date(`${transactionDetails.date} ${transactionDetails.time}`).getTime()
      };
    }

    return null;
  } catch (error) {
    console.error('Error extracting transaction details:', error);
    return null;
  }
};

// Helper function to determine transaction type
export const getTransactionType = (smsMessage: string): string => {
  if (smsMessage.includes('sent to')) return 'SEND_MONEY';
  if (smsMessage.includes('received')) return 'RECEIVE_MONEY';
  if (smsMessage.includes('paid to')) return 'PAY_MERCHANT';
  if (smsMessage.includes('bought')) return 'BUY_AIRTIME';
  if (smsMessage.includes('Withdraw')) return 'WITHDRAW';
  return 'UNKNOWN';
};

/**
 * Start listening for M-PESA SMS messages
 * @param {Function} onTransactionDetected Callback for when a transaction is detected
 * @returns {Promise<void>}
 */
export const listenForMpesaTransactions = async (
  onTransaction: (transaction: Partial<MPESATransaction>) => void,
  onError: (error: string) => void
) => {
  if (Platform.OS !== 'android') {
    onError('SMS scanning is only available on Android devices');
    return;
  }

  if (!SmsRetriever) {
    onError('SMS Retriever is not available');
    return;
  }

  try {
    const startSmsListener = async () => {
      try {
        // We can safely use SmsRetriever here because we checked above
        const registered = await SmsRetriever.startSmsRetriever();
        if (registered) {
          const smsRetriever = SmsRetriever; // Capture in local variable to satisfy TypeScript
          smsRetriever.addSmsListener(event => {
            const { message } = event;
            
            // Check if it's an MPESA message
            if (message && message.includes('MPESA')) {
              const transaction = parseMPESAMessage(message);
              if (transaction) {
                onTransaction(transaction);
              }
            }
          });
        }
      } catch (error) {
        console.error('Error in SMS listener:', error);
        onError('Failed to start SMS listener');
      }
    };

    await startSmsListener();

    // Return cleanup function
    return () => {
      // We can safely use SmsRetriever here because we checked at the start
      if (SmsRetriever) {
        SmsRetriever.removeSmsListener();
      }
    };
  } catch (error) {
    console.error('Error in SMS handling:', error);
    onError('Failed to initialize SMS handling');
  }
};

const parseMPESAMessage = (message: string): Partial<MPESATransaction> | null => {
  // Common regex patterns for different transaction types
  const patterns = {
    send: /(?<transactionId>[A-Z0-9]+) Confirmed\.\s+Ksh(?<amount>[\d,.]+) sent to (?<recipient>[^0-9]+)\s*(?<phone>\d+)? on (?<date>\d{1,2}\/\d{1,2}\/\d{2}) at (?<time>\d{1,2}:\d{2} [APM]{2})/i,
    receive: /(?<transactionId>[A-Z0-9]+) Confirmed\.You have received Ksh(?<amount>[\d,.]+) from (?<sender>[^0-9]+)\s*(?<phone>\d+)? on (?<date>\d{1,2}\/\d{1,2}\/\d{2}) at (?<time>\d{1,2}:\d{2} [APM]{2})/i,
    pay: /(?<transactionId>[A-Z0-9]+) Confirmed\.\s+Ksh(?<amount>[\d,.]+) paid to (?<merchant>[^\.]+)/i,
    withdraw: /(?<transactionId>[A-Z0-9]+) Confirmed\.on (?<date>\d{1,2}\/\d{1,2}\/\d{2}) at (?<time>\d{1,2}:\d{2} [APM]{2})Withdraw Ksh(?<amount>[\d,.]+) from (?<agent>\d+ - [^\.]+)/i,
    airtime: /(?<transactionId>[A-Z0-9]+) confirmed\.You bought Ksh(?<amount>[\d,.]+) of airtime/i,
  };

  let match: RegExpMatchArray | null = null;
  let transactionType: string = '';

  // Try each pattern until we find a match
  for (const [type, pattern] of Object.entries(patterns)) {
    match = message.match(pattern);
    if (match) {
      transactionType = type;
      break;
    }
  }

  if (!match?.groups) return null;

  const { transactionId, amount, date, time } = match.groups;
  const merchant = match.groups.merchant || match.groups.recipient || match.groups.sender || match.groups.agent || 'Unknown';
  const phone = match.groups.phone || undefined;

  // Parse date and time
  const [day, month, year] = (date || '').split('/').map(Number);
  const [hours, minutes] = (time || '').split(':');
  const isPM = time?.includes('PM');

  const timestamp = new Date();
  if (day && month && year) {
    timestamp.setFullYear(2000 + year);
    timestamp.setMonth(month - 1);
    timestamp.setDate(day);
  }
  
  if (hours && minutes) {
    const parsedHours = parseInt(hours);
    timestamp.setHours(isPM && parsedHours !== 12 ? parsedHours + 12 : parsedHours);
    timestamp.setMinutes(parseInt(minutes));
  }

  return {
    transaction_id: transactionId,
    merchant_name: merchant.trim(),
    amount: parseFloat(amount.replace(/,/g, '')),
    description: message,
    time_of_transaction: timestamp.toISOString(),
    is_expense: transactionType !== 'receive',
    phone,
    full_message: message,
  };
};

export default {
  requestSMSPermissions,
  getAppSignature,
  startSmsRetriever,
  extractMpesaTransaction,
  listenForMpesaTransactions
};
