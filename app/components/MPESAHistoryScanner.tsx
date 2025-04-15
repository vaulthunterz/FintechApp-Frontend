import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { listenForMpesaTransactions, requestSMSPermissions, getAppSignature } from "../utils/smsRetrieverUtils";

interface MPESATransaction {
  id: string;
  amount: string;
  merchant: string;
  date: string;
  time: string;
  transactionId: string;
  body: string;
}

const MPESAHistoryScanner: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<MPESATransaction[]>([]);
  const { user } = useAuth();
  const { colors } = useTheme();

  // Check if we're on Android
  const isAndroid = Platform.OS === 'android';
  const [smsAvailable, setSmsAvailable] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // State for module status details
  const [moduleStatus, setModuleStatus] = useState<any>(null);
  const [usingMockModule, setUsingMockModule] = useState<boolean>(false);

  // Check SMS availability and request permissions on component mount
  useEffect(() => {
    const checkSMSAvailability = async () => {
      if (isAndroid) {
        // Get detailed module status
        const status = checkSMSModuleStatus();
        setModuleStatus(status);
        console.log('SMS module status:', status);

        // Check if we're using the mock module
        if (status.details && status.details.usingMockModule) {
          setUsingMockModule(true);
          console.log('Using mock SMS module');
        }

        if (!status.available) {
          setSmsAvailable(false);
          setErrorMessage(`SMS module is not available: ${status.error}. The module may not be properly installed.`);
          return;
        }

        // Then check and request permissions
        try {
          console.log('SMS module is available, checking permissions...');
          const permissionsGranted = await checkAndRequestSMSPermissions();
          setSmsAvailable(permissionsGranted);

          if (!permissionsGranted) {
            setErrorMessage("SMS permissions not granted. Please grant SMS permissions to scan for M-PESA transactions.");
          } else {
            console.log('SMS permissions granted successfully');
          }
        } catch (error) {
          console.error('Error checking SMS permissions:', error);
          setSmsAvailable(false);
          setErrorMessage(`Error checking SMS permissions: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        setSmsAvailable(false);
        setErrorMessage("SMS scanning is only available on Android devices");
      }
    };

    checkSMSAvailability();
  }, [isAndroid]);

  // Early return if not on Android platform
  if (!isAndroid) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          SMS scanning is only available on Android devices
        </Text>
      </View>
    );
  }

  // Show error if SMS module is not available
  if (smsAvailable === false) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          SMS Module Not Available
        </Text>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {errorMessage}
        </Text>
        <Text style={[styles.errorSubText, { color: colors.textSecondary }]}>
          Please make sure the app has SMS permissions and try again.
        </Text>

        {/* Show module status details for debugging */}
        {moduleStatus && (
          <View style={styles.debugContainer}>
            <Text style={[styles.debugTitle, { color: colors.text }]}>Debug Information:</Text>
            <Text style={[styles.debugText, { color: colors.textSecondary }]}>
              Platform: {moduleStatus.details.platform}
            </Text>
            <Text style={[styles.debugText, { color: colors.textSecondary }]}>
              Module Loaded: {moduleStatus.details.moduleLoaded ? 'Yes' : 'No'}
            </Text>
            {moduleStatus.details.moduleError && (
              <Text style={[styles.debugText, { color: colors.error }]}>
                Error: {moduleStatus.details.moduleError}
              </Text>
            )}
            <Text style={[styles.debugText, { color: colors.textSecondary }]}>
              Permissions Checked: {moduleStatus.details.permissionsChecked ? 'Yes' : 'No'}
            </Text>
            <Text style={[styles.debugText, { color: colors.textSecondary }]}>
              Permissions Granted: {moduleStatus.details.permissionsGranted ? 'Yes' : 'No'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: colors.primary }]}
          onPress={async () => {
            // Try to request permissions again
            const granted = await checkAndRequestSMSPermissions();
            setSmsAvailable(granted);
            if (!granted) {
              Toast.show({
                type: "error",
                text1: "Permission Denied",
                text2: "SMS permissions are required to scan messages",
              });
            }
          }}
        >
          <Text style={styles.buttonText}>Request SMS Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const scanMPESAMessages = (daysBack = 30) => {
    setLoading(true);
    setTransactions([]);
    setErrorMessage("");

    // Check if we have the user authenticated
    if (!user) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "You must be logged in to scan messages",
      });
      setLoading(false);
      return;
    }

    try {
      // Calculate the date range (milliseconds)
      const minDate = new Date();
      minDate.setDate(minDate.getDate() - daysBack);

      // Double-check if SMS module is available
      if (!isSMSModuleAvailable()) {
        const errorMsg = 'SMS module is not available';
        console.error(errorMsg);
        setErrorMessage(errorMsg);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "SMS reading is not available on this device",
        });
        setLoading(false);
        setSmsAvailable(false);
        return;
      }

      console.log('Attempting to scan SMS messages...');

      const senderNames = ["Safaricom", "M-PESA"]; // Define the senders to filter for

      // Use our SMS utility to read messages
      readSMS(
        {
          box: "inbox",
          minDate: minDate.getTime(),
        },
        (count, parsedList) => {
          console.log(`Found ${count} SMS messages`);

          if (count > 0) {
            try {
              const mpesaTransactions: MPESATransaction[] = [];

              parsedList.forEach((sms) => {
                if (senderNames.includes(sms.address)) {
                  console.log("Found message from:", sms.address);

                  // Process messages that match M-PESA transaction format
                  // This regex matches both send and receive formats
                  const sendRegex = /You have sent Ksh([\d,.]+)\s*to\s*([\w\s]+)\s*on\s*([\d/]+)\s*at\s*([\d:]+\s*[AP]M).*\s*Transaction ID:\s*([\w\d]+)/i;
                  const receiveRegex = /You have received Ksh([\d,.]+)\s*from\s*([\w\s]+)\s*on\s*([\d/]+)\s*at\s*([\d:]+\s*[AP]M).*\s*Transaction ID:\s*([\w\d]+)/i;

                  let match = sms.body.match(sendRegex) || sms.body.match(receiveRegex);

                  if (match) {
                    console.log("Transaction detected in SMS");
                    const amount = match[1].replace(",", "");
                    const merchant = match[2].trim();
                    const date = match[3];
                    const time = match[4];
                    const transactionId = match[5];

                    mpesaTransactions.push({
                      id: sms._id || `${Date.now()}-${Math.random()}`,
                      amount,
                      merchant,
                      date,
                      time,
                      transactionId,
                      body: sms.body
                    });
                  }
                }
              });

              setTransactions(mpesaTransactions);

              if (mpesaTransactions.length === 0) {
                Toast.show({
                  type: "info",
                  text1: "No Transactions",
                  text2: "No M-PESA transactions found in your messages",
                });
              } else {
                Toast.show({
                  type: "success",
                  text1: "Success",
                  text2: `Found ${mpesaTransactions.length} M-PESA transactions`,
                });
              }
            } catch (parseError) {
              console.error("Error processing SMS list:", parseError);
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to process SMS messages",
              });
            }
          } else {
            Toast.show({
              type: "info",
              text1: "No Messages",
              text2: "No SMS messages found in the specified time range",
            });
          }

          setLoading(false);
        },
        (error) => {
          console.log("Failed to get SMS with error:", error);
          setErrorMessage(`Failed to read SMS messages: ${error}`);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to read SMS messages",
          });
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("Error in SMS handling:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setErrorMessage(`Error in SMS handling: ${errorMsg}`);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "An error occurred while scanning messages",
      });
      setLoading(false);
    }
  };

  const handleAddTransaction = (transaction: MPESATransaction) => {
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
  };

  const renderTransactionItem = ({ item }: { item: MPESATransaction }) => (
    <TouchableOpacity
      style={[styles.transactionItem, { backgroundColor: colors.card }]}
      onPress={() => handleAddTransaction(item)}
    >
      <View style={styles.transactionHeader}>
        <Text style={[styles.merchant, { color: colors.text }]}>{item.merchant}</Text>
        <Text style={[styles.amount, { color: colors.text }]}>Ksh {item.amount}</Text>
      </View>
      <Text style={[styles.date, { color: colors.textSecondary }]}>
        {item.date} at {item.time}
      </Text>
      <Text style={[styles.transactionId, { color: colors.textSecondary }]}>
        Transaction ID: {item.transactionId}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {usingMockModule && (
        <View style={[styles.mockBanner, { backgroundColor: colors.warning }]}>
          <Text style={[styles.mockBannerText, { color: colors.background }]}>
            USING MOCK DATA - Native SMS module not available
          </Text>
        </View>
      )}
      <Text style={[styles.title, { color: colors.text }]}>M-PESA Transaction History</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: colors.primary }]}
          onPress={() => scanMPESAMessages(7)}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Scan Last 7 Days</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: colors.primary }]}
          onPress={() => scanMPESAMessages(30)}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Scan Last 30 Days</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: colors.primary }]}
          onPress={() => scanMPESAMessages(90)}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Scan Last 90 Days</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Scanning SMS messages...
          </Text>
        </View>
      ) : (
        <>
          {transactions.length > 0 ? (
            <FlatList
              data={transactions}
              renderItem={renderTransactionItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No M-PESA transactions found.
              </Text>
              <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
                Tap one of the scan buttons above to search for transactions.
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  scanButton: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
  transactionItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  merchant: {
    fontSize: 16,
    fontWeight: "bold",
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  date: {
    fontSize: 14,
    marginBottom: 4,
  },
  transactionId: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
    padding: 10,
  },
  errorSubText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    marginHorizontal: 40,
    alignItems: "center",
  },
  debugContainer: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginHorizontal: 20,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    marginBottom: 4,
  },
  mockBanner: {
    padding: 8,
    marginBottom: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  mockBannerText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default MPESAHistoryScanner;
