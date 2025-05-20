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
import { processTransaction, batchProcessTransactions, getRecentTransactions } from "../services/transactionService";
import { MPESATransaction, TransactionPaginatedResponse } from "../types/transaction";

const MPESAHistoryScanner: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transactions, setTransactions] = useState<MPESATransaction[]>([]);
  const [pagination, setPagination] = useState<Omit<TransactionPaginatedResponse, 'results'>>({
    count: 0,
    next: null,
    previous: null,
    total_pages: 0,
    current_page: 1,
    page_total_amount: 0
  });
  
  const { user } = useAuth();
  const { colors } = useTheme();

  // Check if we're on Android
  const isAndroid = Platform.OS === 'android';
  const [smsAvailable, setSmsAvailable] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    // Load recent transactions when component mounts
    loadRecentTransactions();
  }, []);

  const loadRecentTransactions = async () => {
    try {
      setLoading(true);
      const response = await getRecentTransactions(20);
      setTransactions(response.results);
      const { results, ...paginationData } = response;
      setPagination(paginationData);
    } catch (error) {
      console.error('Error loading recent transactions:', error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load recent transactions",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check SMS availability and request permissions on component mount
  useEffect(() => {
    const checkSMSAvailability = async () => {
      if (isAndroid) {
        try {
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

  const scanMPESAMessages = async (daysBack = 30) => {
    setLoading(true);
    setScanning(true);
    setErrorMessage("");

    if (!user) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "You must be logged in to scan messages",
      });
      setLoading(false);
      setScanning(false);
      return;
    }

    try {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() - daysBack);

      Toast.show({
        type: "info",
        text1: "Scanning",
        text2: "Scanning SMS messages for M-PESA transactions...",
      });

      // Start listening for M-PESA transactions
      await listenForMpesaTransactions(
        async (transaction) => {
          try {
            setProcessing(true);
            // Process the transaction with ML predictions and store it
            const processedTransaction = await processTransaction(transaction);
            
            // Add to transactions list
            setTransactions(prev => [processedTransaction, ...prev]);
            
            Toast.show({
              type: "success",
              text1: "Transaction Processed",
              text2: `${processedTransaction.merchant_name} - ${processedTransaction.category?.name}`,
            });
          } catch (error) {
            console.error('Error processing transaction:', error);
            Toast.show({
              type: "error",
              text1: "Error",
              text2: "Failed to process transaction",
            });
          } finally {
            setProcessing(false);
          }
        },
        (error) => {
          console.error('Error scanning messages:', error);
          setErrorMessage(error);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: error,
          });
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
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  const handleAddTransaction = (transaction: MPESATransaction) => {
    router.push({
      pathname: "/screens/add-transaction",
      params: {
        transactionId: transaction.transaction_id,
        merchant: transaction.merchant_name,
        amount: transaction.amount.toString(),
        date: transaction.time_of_transaction,
        category: transaction.category?.name,
        subcategory: transaction.subcategory?.name,
        description: transaction.description,
      }
    });
  };

  const renderTransactionItem = ({ item }: { item: MPESATransaction }) => (
    <TouchableOpacity
      style={[styles.transactionItem, { backgroundColor: colors.card }]}
      onPress={() => handleAddTransaction(item)}
    >
      <View style={styles.transactionHeader}>
        <Text style={[styles.merchant, { color: colors.text }]}>{item.merchant_name}</Text>
        <Text style={[styles.amount, { color: colors.text }]}>Ksh {item.amount}</Text>
      </View>
      <Text style={[styles.date, { color: colors.textSecondary }]}>
        {new Date(item.time_of_transaction).toLocaleString()}
      </Text>
      <View style={styles.transactionDetails}>
        <Text style={[styles.transactionId, { color: colors.textSecondary }]}>
          ID: {item.transaction_id}
        </Text>
        {item.category && (
          <Text style={[styles.category, { color: colors.primary }]}>
            {item.category.name} {item.subcategory ? `› ${item.subcategory.name}` : ''}
          </Text>
        )}
      </View>
      {item.confidence && (
        <Text style={[styles.confidence, { color: colors.textSecondary }]}>
          Confidence: {Math.round(item.confidence * 100)}%
        </Text>
      )}
    </TouchableOpacity>
  );

  // Early return if not on Android
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
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: colors.primary }]}
          onPress={async () => {
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>M-PESA Transaction Scanner</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: colors.primary }]}
          onPress={() => scanMPESAMessages(7)}
          disabled={loading || scanning}
        >
          <Text style={styles.buttonText}>Scan Last 7 Days</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: colors.primary }]}
          onPress={() => scanMPESAMessages(30)}
          disabled={loading || scanning}
        >
          <Text style={styles.buttonText}>Scan Last 30 Days</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: colors.primary }]}
          onPress={() => scanMPESAMessages(90)}
          disabled={loading || scanning}
        >
          <Text style={styles.buttonText}>Scan Last 90 Days</Text>
        </TouchableOpacity>
      </View>

      {(loading || scanning || processing) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {scanning ? 'Scanning SMS messages...' : 
             processing ? 'Processing transactions...' : 
             'Loading...'}
          </Text>
        </View>
      )}

      {!loading && !scanning && transactions.length > 0 ? (
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.transaction_id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No M-PESA transactions found
          </Text>
          <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
            Tap one of the scan buttons above to search for transactions
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
    padding: 20,
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
    flex: 1,
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  date: {
    fontSize: 14,
    marginBottom: 4,
  },
  transactionDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionId: {
    fontSize: 12,
  },
  category: {
    fontSize: 12,
    fontWeight: "500",
  },
  confidence: {
    fontSize: 11,
    marginTop: 4,
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
  permissionButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    marginHorizontal: 40,
    alignItems: "center",
  }
});

export default MPESAHistoryScanner;
