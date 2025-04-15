import { useEffect, useCallback, useRef } from "react";
import { AppState, Platform } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { listenForMpesaTransactions } from "../utils/smsRetrieverUtils";
import { showTransactionNotification, addNotificationResponseReceivedListener } from "../utils/notificationUtils";

const BackgroundSMSListener = () => {
  const { user } = useAuth();
  const isAndroid = Platform.OS === 'android';
  const notificationSubscription = useRef<any>(null);

  // Handle transaction detection
  const handleTransactionDetected = useCallback((transaction: any) => {
    console.log('Transaction detected:', transaction);

    // Show a notification with the transaction details
    showTransactionNotification(
      "New Transaction Detected",
      `Amount: Ksh ${transaction.amount} \nMerchant: ${transaction.merchant}\nTime: ${transaction.date} ${transaction.time}`,
      transaction
    ).then((notificationId) => {
      console.log('Notification shown with ID:', notificationId);
    }).catch((error) => {
      console.error('Error showing notification:', error);

      // If notification fails, navigate directly to add transaction screen
      router.push({
        pathname: "/screens/add-transaction",
        params: {
          transactionId: transaction.transactionId,
          merchant: transaction.merchant,
          amount: transaction.amount,
          date: transaction.date,
          time: transaction.time,
          description: "",
        }
      });
    });
  }, []);

  // Listen for SMS messages when app becomes active
  const handleAppStateChange = useCallback((nextAppState: string) => {
    if (nextAppState === "active" && user && isAndroid) {
      console.log('App became active, starting SMS listener');

      // Start listening for M-PESA transactions
      try {
        listenForMpesaTransactions(
          handleTransactionDetected,
          (error: string) => {
            console.error('Error listening for transactions:', error);
          }
        ).catch((error) => {
          console.error('Failed to start SMS listener:', error);
        });
      } catch (error) {
        console.error('Exception when starting SMS listener:', error);
      }
    }
  }, [user, isAndroid, handleTransactionDetected]);

  // Set up notification response handler
  useEffect(() => {
    // Skip if not on Android or user not authenticated
    if (!isAndroid || !user) {
      return;
    }

    // Set up notification response handler
    notificationSubscription.current = addNotificationResponseReceivedListener((response) => {
      console.log('Notification response received:', response);

      // Get the transaction data from the notification
      const transactionData = response.notification.request.content.data;

      // Navigate to add transaction screen
      if (transactionData) {
        router.push({
          pathname: "/screens/add-transaction",
          params: {
            transactionId: transactionData.transactionId,
            merchant: transactionData.merchant,
            amount: transactionData.amount,
            date: transactionData.date,
            time: transactionData.time,
            description: "",
          }
        });
      }
    });

    // Clean up subscription on unmount
    return () => {
      if (notificationSubscription.current) {
        notificationSubscription.current.remove();
      }
    };
  }, [isAndroid, user]);

  // Set up app state change listener
  useEffect(() => {
    // Skip if not on Android
    if (!isAndroid) {
      return;
    }

    // Register app state change listener
    const subscription = AppState.addEventListener("change", handleAppStateChange);

    // Initial check when component mounts
    if (AppState.currentState === "active" && user) {
      handleAppStateChange("active");
    }

    // Clean up subscription on unmount
    return () => {
      subscription.remove();
    };
  }, [isAndroid, handleAppStateChange, user]);

  // This component doesn't render anything
  return null;
};

export default BackgroundSMSListener;
