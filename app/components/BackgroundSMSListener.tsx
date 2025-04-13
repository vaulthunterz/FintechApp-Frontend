import React, { useEffect } from "react";
import { Alert, AppState, Platform, NativeModules } from "react-native";
import SmsAndroid from "react-native-get-sms-android";
import PushNotification from "react-native-push-notification";
import { router } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

const BackgroundSMSListener = () => {
  // Early return if not on Android platform
  if (Platform.OS !== 'android') {
    console.log('SMS Listener is only supported on Android devices');
    return null;
  }

  const senderNames = ["Safaricom", "M-PESA"]; // Define the senders to filter for here
  const { user } = useAuth();

  useEffect(() => {
    try {
      // Create notification channel
      PushNotification.createChannel({
        channelId: "transaction_channel",
        channelName: "Transaction Notifications",
        importance: 4,
      });

      // Register background handler using the new subscription pattern
      const subscription = AppState.addEventListener("change", handleAppStateChange);

      // Initial listen for sms messages
      handleSMSReceived();

      // Removes the subscription on component unmount
      return () => {
        subscription.remove();
      };
    } catch (error) {
      console.error('Error initializing SMS listener:', error);
      return () => {}; // Empty cleanup function
    }
  }, []);

  useEffect(() => {
    try {
      // Configure push notification handling
      PushNotification.configure({
        // Called when a remote or local notification is opened or received
        onNotification: function (notification) {
          console.log("NOTIFICATION:", notification);
          if (notification.action === "Add Description") {
            router.push({
              pathname: "/screens/add-transaction",
              params: notification.userInfo
            });
          }

          // Required on iOS only
          // notification.finish(PushNotificationIOS.FetchResult.NoData);
        },

        // IOS ONLY
        permissions: {
          alert: true,
          badge: true,
          sound: true,
        },

        // Should the initial notification be popped automatically
        popInitialNotification: true,

        /**
         * (optional) default: true
         * - Specified if permissions (ios) and token (android and ios) will requested or not,
         * - if not, you must call PushNotificationsHandler.requestPermissions() later
         */
        requestPermissions: true,
      });
    } catch (error) {
      console.error('Error configuring push notifications:', error);
    }
  }, []);

  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === "active") {
      handleSMSReceived();
    }
  };

  const handleSMSReceived = () => {
    // Check if we have the user authenticated
    if (!user) {
      console.log("User not authenticated, skipping SMS check");
      return;
    }

    try {
      // Verify SmsAndroid is available
      if (!SmsAndroid || typeof SmsAndroid.list !== 'function') {
        console.error('SmsAndroid module not available or not properly initialized');
        return;
      }
      SmsAndroid.list(
        JSON.stringify({
          box: "inbox",
          minDate: new Date().getTime() - 5 * 60 * 1000, // Last 5 minutes
        }),
        (fail) => {
          console.log("Failed to get SMS with error:", fail);
        },
        (count, smsList) => {
          console.log("New SMS messages:", count);
          if (count > 0) {
            try {
              const parsedList = JSON.parse(smsList);
              parsedList.forEach((sms) => {
                if (senderNames.includes(sms.address)) {
                  console.log("Found message from:", sms.address);
                  console.log("Message body:", sms.body);

                  // Process only messages that match your SMS text format
                  const transactionRegex =
                    /You have sent Ksh([\d,.]+)\s*to\s*([\w\s]+)\s*on\s*([\d/]+)\s*at\s*([\d:]+\s*[AP]M).*\s*Transaction ID:\s*([\w\d]+)/i;
                  const match = sms.body.match(transactionRegex);

                  if (match) {
                    console.log("Transaction detected in SMS");
                    const amount = match[1].replace(",", "");
                    const merchant = match[2].trim();
                    const date = match[3];
                    const time = match[4];
                    const transactionId = match[5];

                    console.log("Extracted transaction details:", { amount, merchant, date, time, transactionId });

                    // Create a notification for the transaction
                    try {
                    PushNotification.localNotification({
                      channelId: "transaction_channel",
                      title: "New Transaction Detected",
                      message: `Amount: Ksh ${amount} \nMerchant: ${merchant}\nTime: ${date} ${time}\nTransaction ID: ${transactionId}`,
                      userInfo: {
                        transactionId,
                        merchant,
                        amount,
                        date,
                        time,
                        description: "",
                      },
                      actions: ["Add Description"],
                    });
                    console.log("Notification created successfully");
                  } catch (notificationError) {
                    console.error("Error creating notification:", notificationError);
                  }
                } else {
                  console.log("SMS does not match transaction format");
                }
              }
            });
          } catch (parseError) {
            console.error("Error parsing SMS list:", parseError);
          }
        }
      }
    );
    } catch (error) {
      console.error("Error in SMS handling:", error);
    }
  };

  // This component doesn't render anything
  return null;
};

export default BackgroundSMSListener;
