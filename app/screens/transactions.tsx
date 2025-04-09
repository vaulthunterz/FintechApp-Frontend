import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import Toast from "react-native-toast-message";
import api from "../services/api";
import Header from "../components/Header";
import DrawerMenu from "../components/DrawerMenu";
import { auth } from "../config/firebaseConfig";
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from "date-fns";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Define transaction interface
interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string | { id: string; name: string };
  date: string;
  isExpense: boolean;
  merchant_name?: string;
  time_of_transaction?: string;
}

const TransactionsScreen = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [isFromDatePickerVisible, setFromDatePickerVisible] = useState(false);
  const [isToDatePickerVisible, setToDatePickerVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (user) {
      // Get token from Firebase
      const currentUser = auth.currentUser;
      if (currentUser) {
        currentUser
          .getIdToken()
          .then((userToken) => {
            setToken(userToken);
            fetchTransactions();
          })
          .catch((error) => {
            console.error("Error getting token:", error);
            setLoading(false);
            Toast.show({
              type: "error",
              text1: "Authentication Error",
              text2: "Failed to authenticate. Please log in again.",
              position: "bottom",
            });
          });
      }
    } else {
      // Redirect to login if no user
      router.replace("/screens/login");
    }
  }, [user]);

  useEffect(() => {
    if (transactions.length > 0) {
      filterTransactions();
    }
  }, [searchQuery, fromDate, toDate, transactions]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.fetchTransactions();

      // Process and normalize transaction data
      const normalizedTransactions = response.map((transaction: any) => ({
        id: transaction.id,
        amount: transaction.amount,
        description: transaction.description || '',
        category: transaction.category || { id: '', name: 'Uncategorized' },
        date: transaction.date || new Date().toISOString().split('T')[0],
        isExpense: transaction.is_expense,
        merchant_name: transaction.merchant_name || '',
        time_of_transaction: transaction.time_of_transaction || '',
      }));

      setTransactions(normalizedTransactions);
      setFilteredTransactions(normalizedTransactions);
      console.log(`Loaded ${normalizedTransactions.length} transactions`);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      Toast.show({
        type: "error",
        text1: "Failed to Load",
        text2: "Could not load transactions. Please try again.",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateToAddTransaction = () => {
    router.push("/screens/add-transaction");
  };

  const navigateToHome = () => {
    router.push("/screens/home");
  };

  const showFromDatePicker = () => {
    setFromDatePickerVisible(true);
  };

  const hideFromDatePicker = () => {
    setFromDatePickerVisible(false);
  };

  const showToDatePicker = () => {
    setToDatePickerVisible(true);
  };

  const hideToDatePicker = () => {
    setToDatePickerVisible(false);
  };

  const handleFromDateChange = (event: any, selectedDate?: Date) => {
    setFromDatePickerVisible(false);
    if (selectedDate) {
      setFromDate(selectedDate);
    }
  };

  const handleToDateChange = (event: any, selectedDate?: Date) => {
    setToDatePickerVisible(false);
    if (selectedDate) {
      setToDate(selectedDate);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (typeof t.description === 'string' && t.description.toLowerCase().includes(query)) ||
          (t.merchant_name && t.merchant_name.toLowerCase().includes(query)) ||
          (typeof t.category === 'object' && t.category?.name?.toLowerCase().includes(query)) ||
          (typeof t.category === 'string' && t.category.toLowerCase().includes(query))
      );
    }

    // Filter by date range
    if (fromDate) {
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= fromDate;
      });
    }

    if (toDate) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate <= endDate;
      });
    }

    setFilteredTransactions(filtered);
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    // Format date with fallback for invalid dates
    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return "No date";

      try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) {
          return "No date";
        }
        return date.toLocaleDateString();
      } catch (e) {
        console.error("Invalid date format:", dateString);
        return "No date";
      }
    };

    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() => {
          // Navigate to transaction details
          router.push(`/screens/edit-transaction?id=${item.id}`);
        }}
      >
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionCategory}>
            {typeof item.category === 'object' && item.category !== null ? item.category.name : item.category}
          </Text>
          <Text style={styles.transactionDate}>
            {formatDate(item.date || item.time_of_transaction)}
          </Text>
        </View>
        <Text
          style={[
            styles.transactionAmount,
            item.isExpense ? styles.expenseAmount : styles.incomeAmount,
          ]}
        >
          {item.isExpense ? "-" : "+"}${parseFloat(String(item.amount)).toFixed(2)}
        </Text>
      </TouchableOpacity>
    );
  };

  const toggleDrawer = () => {
    setDrawerVisible(!drawerVisible);
  };

  return (
    <View style={styles.container}>
      <Header showBackButton={true} isRootScreen={true} onMenuPress={toggleDrawer} />
      <DrawerMenu isVisible={drawerVisible} onClose={toggleDrawer} />

      <View style={styles.titleContainer}>
        <Text style={styles.screenTitle}>Transactions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={navigateToAddTransaction}
        >
          <Ionicons name="add-circle" size={24} color="#1e88e5" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />

        <View style={styles.dateFiltersContainer}>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={showFromDatePicker}
          >
            <Text style={styles.datePickerButtonText}>
              {fromDate ? format(fromDate, 'MMM dd, yyyy') : 'From Date'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={showToDatePicker}
          >
            <Text style={styles.datePickerButtonText}>
              {toDate ? format(toDate, 'MMM dd, yyyy') : 'To Date'}
            </Text>
          </TouchableOpacity>

          {fromDate || toDate ? (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setFromDate(null);
                setToDate(null);
              }}
            >
              <Ionicons name="close-circle-outline" size={20} color="#f44336" />
            </TouchableOpacity>
          ) : null}
        </View>

        {isFromDatePickerVisible && (
          <DateTimePicker
            value={fromDate || new Date()}
            mode="date"
            onChange={handleFromDateChange}
          />
        )}

        {isToDatePickerVisible && (
          <DateTimePicker
            value={toDate || new Date()}
            mode="date"
            onChange={handleToDateChange}
          />
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e88e5" />
        </View>
      ) : filteredTransactions.length > 0 ? (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransactionItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No transactions yet</Text>
          <TouchableOpacity
            style={styles.addTransactionButton}
            onPress={navigateToAddTransaction}
          >
            <Text style={styles.addTransactionButtonText}>Add Transaction</Text>
          </TouchableOpacity>
        </View>
      )}
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 15,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  transactionCategory: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  expenseAmount: {
    color: "#e53935",
  },
  incomeAmount: {
    color: "#43a047",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginTop: 10,
    marginBottom: 20,
  },
  addTransactionButton: {
    backgroundColor: "#1e88e5",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  addTransactionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  filterContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 12,
    color: '#333',
  },
  dateFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
    marginRight: 8,
  },
  datePickerButtonText: {
    fontSize: 14,
    color: '#666',
  },
  clearFiltersButton: {
    padding: 8,
  },
  transactionDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
});

export default TransactionsScreen;