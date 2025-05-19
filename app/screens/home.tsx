import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
// ExpenseChart is used in the transactions screen
import FinancialDataVisualizer from "../components/charts/FinancialDataVisualizer";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import Toast from "react-native-toast-message";
import api from "../services/api";
import Header from "../components/Header";
import ChatPanel from "../components/ChatPanel";
import DrawerMenu from "../components/DrawerMenu";
import { auth } from "../config/firebaseConfig";
import { format } from 'date-fns';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Define transaction interface
interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string | { id: string; name: string };
  date?: string;
  is_expense: boolean;
  merchant_name?: string;
  time_of_transaction?: string;
  transaction_id?: string;
}

// Define chart data interface
interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
  }[];
}

// Define pie chart data interface
interface PieChartData {
  name: string;
  amount: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

// Define statistics interface
interface Statistics {
  totalExpenses: number;
  totalIncome: number;
  netAmount: number;
  categorySummary: {
    category: string;
    amount: number;
  }[];
}

// Helper function to generate random color based on input string
// Currently unused but kept for future reference
/*
const getRandomColor = (str: string) => {
  // Generate color based on string hash
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert hash to color
  const c = (hash & 0x00FFFFFF)
    .toString(16)
    .toUpperCase();

  return "#" + "00000".substring(0, 6 - c.length) + c;
};
*/

const HomeScreen = () => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  // Removed unused chart state variables
  const [token, setToken] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [timePeriod, setTimePeriod] = useState("all"); // all, week, month, year
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Pagination state
  const [paginationInfo, setPaginationInfo] = useState<{
    count: number;
    next: string | null;
    previous: string | null;
    totalPages: number;
    currentPage: number;
    pageTotalAmount?: number;
  }>({ count: 0, next: null, previous: null, totalPages: 1, currentPage: 1 });

  const screenWidth = Dimensions.get("window").width - 40;

  useEffect(() => {
    if (user) {
      // Get token from Firebase
      const currentUser = auth.currentUser;
      if (currentUser) {
        currentUser.getIdToken().then((tkn) => {
          setToken(tkn);
          // Fetch transactions immediately after getting the token
          fetchTransactions();
        }).catch((err) => {
          console.error("Token fetch error", err);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to get token",
          });
        });
      } else {
        console.error("No current user found in Firebase auth");
      }
    }
  }, [user]);

  useEffect(() => {
    if (token && transactions.length > 0) {
      fetchTransactionStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, transactions, timePeriod]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTransactions(transactions);
    } else {
      const filtered = transactions.filter(
        (transaction) =>
          transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (typeof transaction.category === 'string'
            ? transaction.category.toLowerCase().includes(searchQuery.toLowerCase())
            : transaction.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (transaction.merchant_name &&
            transaction.merchant_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredTransactions(filtered);
    }
  }, [searchQuery, transactions]);

  const fetchTransactions = async (page?: number) => {
    try {
      setLoading(true);
      // Add page parameter to the API call if provided
      const endpoint = page ? `/api/expenses/transactions/?page=${page}` : '/api/expenses/transactions/';
      const response = await api.getTransactionsWithPagination(endpoint);

      if (response && response.data) {
        // Sort transactions by date (newest first)
        const sortedTransactions = [...response.data].sort((a: Transaction, b: Transaction) => {
          const dateA = a.date || a.time_of_transaction || '';
          const dateB = b.date || b.time_of_transaction || '';
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });

        // Store pagination info if available
        if (response.pagination) {
          console.log('Pagination info:', response.pagination);
          setPaginationInfo(response.pagination);
        }

        setTransactions(sortedTransactions);
        setFilteredTransactions(sortedTransactions);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to fetch transactions",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionStats = async () => {
    try {
      setLoading(true);

      // Calculate totals from transactions array
      let totalIncome = 0;
      let totalExpenses = 0;

      transactions.forEach(transaction => {
        const amount = typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount;
        if (!isNaN(amount)) {
          if (transaction.is_expense) {
            totalExpenses += amount;
          } else {
            totalIncome += amount;
          }
        }
      });

      // Calculate net amount (income - expenses)
      const netAmount = totalIncome - totalExpenses;

      // Create category summary
      const categoryMap = new Map();
      transactions.forEach(transaction => {
        if (transaction.is_expense) {  // Only include expenses in category summary
          const amount = typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount;
          const categoryName = typeof transaction.category === 'string'
            ? transaction.category
            : transaction.category?.name || 'Uncategorized';

          if (!isNaN(amount)) {
            const currentAmount = categoryMap.get(categoryName) || 0;
            categoryMap.set(categoryName, currentAmount + amount);
          }
        }
      });

      // Convert category map to array and sort by amount
      const categorySummary = Array.from(categoryMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

      const statsData = {
        totalIncome,
        totalExpenses,
        netAmount,
        categorySummary
      };

      setStatistics(statsData);

        // Prepare pie chart data from categorySummary
      if (categorySummary.length > 0) {
          const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"];
        const pieData = categorySummary.slice(0, 5).map((item, index) => ({
            name: item.category,
            amount: item.amount,
            color: colors[index % colors.length],
            legendFontColor: "#7F7F7F",
            legendFontSize: 12,
          }));

          setPieChartData(pieData);
        }

        // Create line chart data
          const chartData: ChartData = {
            labels: ["Income", "Expenses", "Net"],
            datasets: [
              {
                data: [
              totalIncome,
              totalExpenses,
              netAmount,
                ],
              },
            ],
          };

          setChartData(chartData);

    } catch (error) {
      console.error("Error calculating transaction stats:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to calculate statistics",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  const navigateToTransactions = () => {
    router.push("/screens/transactions");
  };

  const navigateToAddTransaction = () => {
    router.push("/screens/add-transaction");
  };

  // These navigation functions are kept for reference but currently unused
  /*
  const navigateToModelMetrics = () => {
    router.push("/screens/model-metrics");
  };

  const navigateToSettings = () => {
    router.push("/screens/settings");
  };
  */

  const toggleChatPanel = () => {
    setShowChatPanel(!showChatPanel);
  };

  const selectTimePeriod = (period: string) => {
    setTimePeriod(period);
  };

  const toggleDrawer = () => {
    setDrawerVisible(!drawerVisible);
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return "No date";
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return "No date";
        }
        return format(date, 'MMM dd, yyyy');
      } catch (e) {
        console.error("Invalid date format:", dateString);
        return "No date";
      }
    };

    // Determine amount color based on transaction type
    const amountColor = item.is_expense ? colors.error : colors.success; // Red for expenses, green for income
    const amountPrefix = item.is_expense ? '-' : '+';

    // Convert amount to number if it's a string
    const amount = typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount;

    return (
      <TouchableOpacity
        style={[styles.transactionItem, dynamicStyles.transactionCard]}
        onPress={() => router.push(`/screens/edit-transaction?id=${item.id}`)}
      >
        <View style={styles.transactionContent}>
          <View style={styles.transactionLeft}>
            <Text style={[styles.transactionDescription, dynamicStyles.transactionTitle]}>
              {item.merchant_name || item.description}
            </Text>
          <Text style={[styles.transactionCategory, { color: colors.textSecondary }]}>
              {typeof item.category === 'string' ? item.category : item.category?.name}
          </Text>
          <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
              {formatDate(item.time_of_transaction)}
            </Text>
          </View>
          <View style={styles.transactionRight}>
            <Text style={[styles.transactionAmount, { color: amountColor }]}>
              {amountPrefix}KES {isNaN(amount) ? '0.00' : parseFloat(String(amount)).toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 2,
    color: (opacity = 1) => {
      // Convert hex to rgba
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      };

      const rgb = hexToRgb(colors.primary);
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    },
    labelColor: (opacity = 1) => {
      const rgb = isDark ? { r: 224, g: 224, b: 224 } : { r: 33, g: 37, b: 41 };
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    },
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: colors.primary,
    },
  };

  // Create dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: colors.background,
    },
    content: {
      backgroundColor: colors.background,
    },
    sectionTitle: {
      color: colors.text,
    },
    loadingText: {
      color: colors.text,
    },
    summaryCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    summaryTitle: {
      color: colors.text,
    },
    summaryValue: {
      color: colors.text,
    },
    timeFilterButton: {
      borderColor: colors.border,
    },
    timeFilterText: {
      color: colors.textSecondary,
    },
    activeTimeFilter: {
      backgroundColor: colors.primary,
    },
    activeTimeFilterText: {
      color: '#fff',
    },
    transactionCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    transactionTitle: {
      color: colors.text,
    },
    transactionAmount: {
      color: colors.text,
    },
    searchInput: {
      backgroundColor: colors.card,
      color: colors.text,
      borderColor: colors.border,
    },
  };

  if (loading && transactions.length === 0) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, dynamicStyles.loadingText]}>Loading your financial data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Header isRootScreen={true} onMenuPress={toggleDrawer} />
      <DrawerMenu isVisible={drawerVisible} onClose={toggleDrawer} />

        <ScrollView
          style={[styles.content, dynamicStyles.content]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.summaryContainer}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Financial Summary</Text>

            <View style={styles.timeFilterContainer}>
              <TouchableOpacity
                style={[styles.timeFilterButton, dynamicStyles.timeFilterButton, timePeriod === "all" && [styles.activeTimeFilter, dynamicStyles.activeTimeFilter]]}
                onPress={() => selectTimePeriod("all")}
              >
                <Text style={[styles.timeFilterText, dynamicStyles.timeFilterText, timePeriod === "all" && [styles.activeTimeFilterText, dynamicStyles.activeTimeFilterText]]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timeFilterButton, dynamicStyles.timeFilterButton, timePeriod === "week" && [styles.activeTimeFilter, dynamicStyles.activeTimeFilter]]}
                onPress={() => selectTimePeriod("week")}
              >
                <Text style={[styles.timeFilterText, dynamicStyles.timeFilterText, timePeriod === "week" && [styles.activeTimeFilterText, dynamicStyles.activeTimeFilterText]]}>Week</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timeFilterButton, dynamicStyles.timeFilterButton, timePeriod === "month" && [styles.activeTimeFilter, dynamicStyles.activeTimeFilter]]}
                onPress={() => selectTimePeriod("month")}
              >
                <Text style={[styles.timeFilterText, dynamicStyles.timeFilterText, timePeriod === "month" && [styles.activeTimeFilterText, dynamicStyles.activeTimeFilterText]]}>Month</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timeFilterButton, dynamicStyles.timeFilterButton, timePeriod === "year" && [styles.activeTimeFilter, dynamicStyles.activeTimeFilter]]}
                onPress={() => selectTimePeriod("year")}
              >
                <Text style={[styles.timeFilterText, dynamicStyles.timeFilterText, timePeriod === "year" && [styles.activeTimeFilterText, dynamicStyles.activeTimeFilterText]]}>Year</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.balanceCards}>
              <View style={[styles.balanceCard, styles.incomeCard]}>
                <Text style={styles.balanceLabel}>Income</Text>
                <Text style={styles.balanceValue}>
                  KES {statistics ? parseFloat(String(statistics.totalIncome)).toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "0.00"}
                </Text>
              </View>

              <View style={[styles.balanceCard, styles.expenseCard]}>
                <Text style={styles.balanceLabel}>Expenses</Text>
                <Text style={styles.balanceValue}>
                  KES {statistics ? parseFloat(String(statistics.totalExpenses)).toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "0.00"}
                </Text>
              </View>

              <View style={[styles.balanceCard, styles.netCard]}>
                <Text style={styles.balanceLabel}>Net</Text>
                <Text style={styles.balanceValue}>
                  KES {statistics ? parseFloat(String(statistics.netAmount)).toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "0.00"}
                </Text>
              </View>
            </View>

            {/* Enhanced Data Visualization */}
            <FinancialDataVisualizer
              transactions={filteredTransactions}
              width={screenWidth - 40}
              showFilters={true}
            />

            {/* Legacy charts removed and replaced with Victory Native charts */}
          </View>

          <View style={styles.recentTransactionsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Recent Transactions</Text>
              <TouchableOpacity onPress={navigateToTransactions}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={[styles.searchInput, dynamicStyles.searchInput]}
                placeholder="Search transactions..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {filteredTransactions.length > 0 ? (
              <>
                <FlatList
                  data={filteredTransactions.slice(0, 5)}
                  keyExtractor={(item) => item.id}
                  renderItem={renderTransactionItem}
                  scrollEnabled={false}
                />

                {/* Pagination Controls */}
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    style={[styles.paginationButton, { backgroundColor: colors.card, borderColor: colors.border }, paginationInfo.previous === null && styles.paginationButtonDisabled]}
                    onPress={() => paginationInfo.previous && fetchTransactions(paginationInfo.currentPage - 1)}
                    disabled={paginationInfo.previous === null}
                  >
                    <Text style={[styles.paginationButtonText, { color: colors.text }]}>Previous</Text>
                  </TouchableOpacity>

                  <Text style={[styles.paginationText, { color: colors.text }]}>
                    Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
                  </Text>

                  <TouchableOpacity
                    style={[styles.paginationButton, { backgroundColor: colors.card, borderColor: colors.border }, paginationInfo.next === null && styles.paginationButtonDisabled]}
                    onPress={() => paginationInfo.next && fetchTransactions(paginationInfo.currentPage + 1)}
                    disabled={paginationInfo.next === null}
                  >
                    <Text style={[styles.paginationButtonText, { color: colors.text }]}>Next</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>No transactions found</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Add Transaction FAB - Left side */}
            <TouchableOpacity
              style={[styles.addButtonLeft, { backgroundColor: colors.primary }]}
              onPress={navigateToAddTransaction}
            >
              <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>

      {/* Chat FAB - Right side */}
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
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    height: 40,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 14,
  },
  summaryContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  timeFilterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    backgroundColor: "#eee",
    borderRadius: 20,
    padding: 3,
  },
  timeFilterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 17,
  },
  activeTimeFilter: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeFilterText: {
    fontSize: 12,
    color: "#666",
  },
  activeTimeFilterText: {
    color: "#1e88e5",
    fontWeight: "bold",
  },
  balanceCards: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  balanceCard: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  incomeCard: {
    backgroundColor: "#E3F2FD",
  },
  expenseCard: {
    backgroundColor: "#FFEBEE",
  },
  netCard: {
    backgroundColor: "#E8F5E9",
  },
  balanceLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  chartContainer: {
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 10,
  },
  pieChartContainer: {
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recentTransactionsContainer: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  viewAllText: {
    color: "#1e88e5",
    fontSize: 14,
  },
  transactionItem: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  transactionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  transactionLeft: {
    flex: 1,
    marginRight: 10,
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: "#999",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  expenseAmount: {
    color: "#e53935",
  },
  incomeAmount: {
    color: "#43a047",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  addButtonLeft: {
    position: "absolute",
    left: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1e88e5",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 999,
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
  // Pagination styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  paginationButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  paginationButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  paginationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  paginationText: {
    fontSize: 14,
    color: '#555',
  },
});

export default HomeScreen;