/**
 * Notification Utilities
 * 
 * This file provides utilities for working with notifications using expo-notifications.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications
 * @returns {Promise<string>} Expo push token
 */
export const registerForPushNotificationsAsync = async (): Promise<string> => {
  let token;
  
  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return '';
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo push token:', token);
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
    
    // Create a channel for transaction notifications
    Notifications.setNotificationChannelAsync('transactions', {
      name: 'Transactions',
      description: 'Notifications for financial transactions',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
    });
  }

  return token || '';
};

/**
 * Schedule a local notification
 * @param {string} title Notification title
 * @param {string} body Notification body
 * @param {object} data Additional data to include with the notification
 * @param {number} seconds Seconds to wait before showing the notification
 * @returns {Promise<string>} Notification identifier
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data: any = {},
  seconds: number = 1
): Promise<string> => {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      badge: 1,
    },
    trigger: { seconds },
  });
  
  return identifier;
};

/**
 * Show a transaction notification
 * @param {string} title Notification title
 * @param {string} body Notification body
 * @param {object} transactionData Transaction data
 * @returns {Promise<string>} Notification identifier
 */
export const showTransactionNotification = async (
  title: string,
  body: string,
  transactionData: any
): Promise<string> => {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: transactionData,
      sound: true,
      badge: 1,
      categoryIdentifier: 'transactions',
    },
    trigger: null, // Show immediately
  });
  
  return identifier;
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/**
 * Add a notification received listener
 * @param {Function} listener Function to call when a notification is received
 * @returns {Subscription} Subscription object
 */
export const addNotificationReceivedListener = (
  listener: (notification: Notifications.Notification) => void
): Notifications.Subscription => {
  return Notifications.addNotificationReceivedListener(listener);
};

/**
 * Add a notification response received listener
 * @param {Function} listener Function to call when a notification response is received
 * @returns {Subscription} Subscription object
 */
export const addNotificationResponseReceivedListener = (
  listener: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription => {
  return Notifications.addNotificationResponseReceivedListener(listener);
};

export default {
  registerForPushNotificationsAsync,
  scheduleLocalNotification,
  showTransactionNotification,
  cancelAllNotifications,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
};
