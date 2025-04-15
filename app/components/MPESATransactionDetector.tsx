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
import { listenForMpesaTransactions, requestSMSPermissions, getAppSignature, extractMpesaTransaction } from "../utils/smsRetrieverUtils";

interface MPESATransaction {
  id: string;
  amount: string;
  merchant: string;
  date: string;
  time: string;
  transactionId: string;
  fullMessage?: string;
}

const MPESATransactionDetector: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<MPESATransaction[]>([]);
  const { user } = useAuth();
  const { colors } = useTheme();

  // Check if we're on Android
  const isAndroid = Platform.OS === 'android';
  const [smsAvailable, setSmsAvailable] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [appSignature, setAppSignature] = useState<string | null>(null);

  // Check SMS availability and request permissions on component mount
  useEffect(() => {
    const checkSMSAvailability = async () => {
      if (isAndroid) {
        try {
          // Get app signature for SMS Retriever
          const signature = await getAppSignature();
          setAppSignature(signature);
          console.log('App signature for SMS Retriever:', signature);
          
          // Request SMS permissions
          const permissionsGranted = await requestSMSPermissions();
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

  // Show error if SMS permissions are not available
  if (smsAvailable === false) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          SMS Permissions Required
        </Text>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {errorMessage}
        </Text>
        <Text style={[styles.errorSubText, { color: colors.textSecondary }]}>
          Please grant SMS permissions to scan for M-PESA transactions.
        </Text>
        
        <TouchableOpacity 
          style={[styles.permissionButton, { backgroundColor: colors.primary }]}
          onPress={async () => {
            // Try to request permissions again
            const granted = await requestSMSPermissions();
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

  const scanMPESAMessages = async () => {
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
      Toast.show({
        type: "info",
        text1: "Listening",
        text2: "Waiting for incoming M-PESA SMS messages...",
      });
      
      // Listen for M-PESA transactions
      await listenForMpesaTransactions(
        (transaction) => {
          // Transaction detected
          console.log('Transaction detected:', transaction);
          
          // Add to transactions list
          setTransactions(prev => [transaction, ...prev]);
          
          Toast.show({
            type: "success",
            text1: "Transaction Detected",
            text2: `Found M-PESA transaction of Ksh ${transaction.amount}`,
          });
          
          setLoading(false);
        },
        (error) => {
          // Error occurred
          console.error('Error detecting transactions:', error);
          setErrorMessage(error);
          
          Toast.show({
            type: "error",
            text1: "Error",
            text2: error,
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
        {item.date} {item.time}
      </Text>
      <Text style={[styles.transactionId, { color: colors.textSecondary }]}>
        ID: {item.transactionId}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {appSignature && (
        <View style={[styles.signatureBanner, { backgroundColor: colors.card }]}>
          <Text style={[styles.signatureText, { color: colors.text }]}>
            App Signature: {appSignature}
          </Text>
          <Text style={[styles.signatureSubText, { color: colors.textSecondary }]}>
            Use this signature in your SMS messages for testing
          </Text>
        </View>
      )}
      
      <Text style={[styles.title, { color: colors.text }]}>M-PESA Transaction Detector</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: colors.primary }]}
          onPress={scanMPESAMessages}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Listen for M-PESA SMS</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Waiting for M-PESA SMS messages...
          </Text>
        </View>
      ) : transactions.length > 0 ? (
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id || item.transactionId}
          style={styles.listContainer}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No transactions detected
          </Text>
          <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
            Tap the button above to start listening for M-PESA SMS messages
          </Text>
        </View>
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
  signatureBanner: {
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  signatureText: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  signatureSubText: {
    fontSize: 12,
    textAlign: 'center',
  }
});

export default MPESATransactionDetector;
