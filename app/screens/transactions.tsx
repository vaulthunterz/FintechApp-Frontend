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
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import Toast from "react-native-toast-message";
import api from "../services/api";
import Header from "../components/Header";
import DrawerMenu from "../components/DrawerMenu";
import { auth } from "../config/firebaseConfig";
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from "date-fns";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FinancialDataVisualizer } from "../components/charts";
import ChatPanel from "../components/ChatPanel";

// Define transaction interface
interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string | { id: string; name: string };
  date: string;
  is_expense: boolean;
  merchant_name?: string;
  time_of_transaction?: string;
}

const TransactionsScreen = () => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
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
  const [showChatPanel, setShowChatPanel] = useState(false);

  // Pagination state
  const [paginationInfo, setPaginationInfo] = useState<{
    count: number;
    next: string | null;
    previous: string | null;
    totalPages: number;
    currentPage: number;
    pageTotalAmount?: number;
  }>({ count: 0, next: null, previous: null, totalPages: 1, currentPage: 1 });
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

  const fetchTransactions = async (page?: number) => {
    try {
      setLoading(true);
      const response = await api.fetchTransactions(page);

      // Check if response has data property
      if (response && response.data) {
        // Process and normalize transaction data
        const normalizedTransactions = response.data.map((transaction: any) => ({
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

        // Update pagination info if available
        if (response.pagination) {
          setPaginationInfo(response.pagination);
          console.log('Pagination info:', response.pagination);
        }
      } else {
        console.error("Unexpected response format:", response);
        Toast.show({
          type: "error",
          text1: "Data Error",
          text2: "Received unexpected data format from server.",
          position: "bottom",
        });
      }
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
        return format(date, 'MMM dd, yyyy');
      } catch (e) {
        console.error("Invalid date format:", dateString);
        return "No date";
      }
    };

    return (
      <TouchableOpacity
        style={[styles.transactionItem, dynamicStyles.transactionItem]}
        onPress={() => {
          // Navigate to transaction details
          router.push(`/screens/edit-transaction?id=${item.id}`);
        }}
      >
        <View style={styles.transactionInfo}>
          <Text style={[styles.transactionDescription, dynamicStyles.transactionDescription]}>{item.description}</Text>
          <Text style={[styles.transactionCategory, dynamicStyles.transactionCategory]}>
            {typeof item.category === 'object' && item.category !== null ? item.category.name : item.category}
          </Text>
          <Text style={[styles.transactionDate, dynamicStyles.transactionDate]}>
            {formatDate(item.date || item.time_of_transaction)}
          </Text>
        </View>
        <Text
          style={[
            styles.transactionAmount,
            { color: item.is_expense ? colors.error : colors.success },
          ]}
        >
          {item.is_expense ? "-" : "+"}KES {parseFloat(String(item.amount)).toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </Text>
      </TouchableOpacity>
    );
  };

  const toggleDrawer = () => {
    setDrawerVisible(!drawerVisible);
  };

  const toggleChatPanel = () => {
    setShowChatPanel(!showChatPanel);
  };

  // Pie chart data: aggregate expenses by category for pie chart
  const categoryTotals: Record<string, number> = {};
  filteredTransactions.forEach(tx => {
    if (tx.is_expense) {
      const cat = typeof tx.category === 'string' ? tx.category : tx.category?.name || 'Uncategorized';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(tx.amount);
    }
  });
  const pieData = Object.entries(categoryTotals).map(([x, y]) => ({ x, y }));

  // Create dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: colors.background,
    },
    screenTitle: {
      color: colors.text,
    },
    filterContainer: {
      backgroundColor: colors.card,
    },
    searchInput: {
      backgroundColor: colors.card,
      color: colors.text,
      borderColor: colors.border,
    },
    datePickerButton: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    datePickerButtonText: {
      color: colors.text,
    },
    transactionItem: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    transactionDescription: {
      color: colors.text,
    },
    transactionCategory: {
      color: colors.textSecondary,
    },
    transactionDate: {
      color: colors.textSecondary,
    },
    paginationText: {
      color: colors.text,
    },
    paginationButton: {
      backgroundColor: colors.primary,
    },
    paginationButtonText: {
      color: colors.headerText,
    },
    emptyStateText: {
      color: colors.textSecondary,
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Header showBackButton={true} isRootScreen={true} onMenuPress={toggleDrawer} />
      <DrawerMenu isVisible={drawerVisible} onClose={toggleDrawer} />

      <View style={styles.titleContainer}>
        <Text style={[styles.screenTitle, dynamicStyles.screenTitle]}>Transactions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={navigateToAddTransaction}
        >
          <Ionicons name="add-circle" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.filterContainer, dynamicStyles.filterContainer]}>
        <TextInput
          style={[styles.searchInput, dynamicStyles.searchInput]}
          placeholder="Search transactions..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textSecondary}
        />

        <View style={styles.dateFiltersContainer}>
          <TouchableOpacity
            style={[styles.datePickerButton, dynamicStyles.datePickerButton]}
            onPress={showFromDatePicker}
          >
            <Text style={[styles.datePickerButtonText, dynamicStyles.datePickerButtonText]}>
              {fromDate ? format(fromDate, 'MMM dd, yyyy') : 'From Date'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.datePickerButton, dynamicStyles.datePickerButton]}
            onPress={showToDatePicker}
          >
            <Text style={[styles.datePickerButtonText, dynamicStyles.datePickerButtonText]}>
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
              <Ionicons name="close-circle-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          ) : null}
        </View>

        {isFromDatePickerVisible && (
          <DateTimePicker
            value={fromDate || new Date()}
            mode="date"
            onChange={handleFromDateChange}
            themeVariant={isDark ? 'dark' : 'light'}
          />
        )}

        {isToDatePickerVisible && (
          <DateTimePicker
            value={toDate || new Date()}
            mode="date"
            onChange={handleToDateChange}
            themeVariant={isDark ? 'dark' : 'light'}
          />
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredTransactions.length > 0 ? (
        <ScrollView style={{ flex: 1 }}>
          {/* Pie chart for category distribution */}
          {pieData.length > 0 && (
            <View style={{ marginTop: 20, marginHorizontal: 15, backgroundColor: colors.card, borderRadius: 10, padding: 10 }}>
              <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Spending by Category</Text>
              <FinancialDataVisualizer
                transactions={filteredTransactions}
                timePeriod={null}
                width={undefined}
                pieData={pieData}
              />
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20, marginLeft: 15 }]}>Transaction History</Text>

          <FlatList
            data={filteredTransactions}
            keyExtractor={(item) => item.id}
            renderItem={renderTransactionItem}
            contentContainerStyle={styles.listContent}
            scrollEnabled={false}
            nestedScrollEnabled={true}
          />

          {/* Pagination Controls */}
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.paginationButton, dynamicStyles.paginationButton, paginationInfo.previous === null && styles.paginationButtonDisabled]}
              onPress={() => paginationInfo.previous && fetchTransactions(paginationInfo.currentPage - 1)}
              disabled={paginationInfo.previous === null}
            >
              <Text style={[styles.paginationButtonText, dynamicStyles.paginationButtonText]}>Previous</Text>
            </TouchableOpacity>

            <Text style={[styles.paginationText, dynamicStyles.paginationText]}>
              Page {paginationInfo.currentPage} of {paginationInfo.totalPages} ({paginationInfo.count} total)
            </Text>

            <TouchableOpacity
              style={[styles.paginationButton, dynamicStyles.paginationButton, paginationInfo.next === null && styles.paginationButtonDisabled]}
              onPress={() => paginationInfo.next && fetchTransactions(paginationInfo.currentPage + 1)}
              disabled={paginationInfo.next === null}
            >
              <Text style={[styles.paginationButtonText, dynamicStyles.paginationButtonText]}>Next</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={60} color={colors.textSecondary} />
          <Text style={[styles.emptyText, dynamicStyles.emptyStateText]}>No transactions yet</Text>
          <TouchableOpacity
            style={[styles.addTransactionButton, { backgroundColor: colors.primary }]}
            onPress={navigateToAddTransaction}
          >
            <Text style={[styles.addTransactionButtonText, { color: colors.headerText }]}>Add Transaction</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Chat FAB */}
      <TouchableOpacity
        style={[styles.chatButtonFab, { backgroundColor: colors.primary }]}
        onPress={toggleChatPanel}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="white" />
      </TouchableOpacity>

      {/* Chat Panel as overlay */}
      {showChatPanel && (
        <ChatPanel onClose={() => setShowChatPanel(false)} />
      )}

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
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
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)",
    elevation: 2,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: "500",
  },
  transactionCategory: {
    fontSize: 14,
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
    marginTop: 10,
    marginBottom: 20,
  },
  addTransactionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  addTransactionButtonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  filterContainer: {
    padding: 16,
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
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 12,
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
    marginRight: 8,
  },
  datePickerButtonText: {
    fontSize: 14,
  },
  clearFiltersButton: {
    padding: 8,
  },
  transactionDate: {
    fontSize: 14,
    marginTop: 4,
  },
  // Pagination styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  paginationButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  paginationText: {
    fontSize: 14,
  },
  chatButtonFab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 999,
  },
});

export default TransactionsScreen;