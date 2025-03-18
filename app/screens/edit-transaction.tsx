import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import Toast from "react-native-toast-message";
import api from "../services/api";
import Header from "../components/Header";
import { auth } from "../config/firebaseConfig";
import { Picker } from "@react-native-picker/picker";

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

interface Transaction {
  id: string;
  merchant_name?: string;
  amount: number;
  description: string;
  category?: {
    id: string;
    name: string;
  };
  subcategory?: {
    id: string;
    name: string;
  };
  category_id?: string;
  subcategory_id?: string;
  time_of_transaction?: string;
  date?: string;
  isExpense?: boolean;
  transaction_id?: string;
}

const EditTransactionScreen = () => {
  const { id } = useLocalSearchParams();
  const transactionId = typeof id === "string" ? id : "";
  const { user } = useAuth();
  
  const [merchantName, setMerchantName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeOfTransaction, setTimeOfTransaction] = useState<string | null>(null);
  const [originalTransactionId, setOriginalTransactionId] = useState<string | null>(null);
  const [isExpense, setIsExpense] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [djangoPrimaryKey, setDjangoPrimaryKey] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Get token from Firebase
      const currentUser = auth.currentUser;
      if (currentUser) {
        currentUser.getIdToken().then((tkn: string) => {
          setToken(tkn);
        }).catch((err: Error) => {
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
    if (token) {
      console.log("Fetching transaction with ID:", transactionId);
      fetchTransaction(transactionId);
    }
  }, [token, transactionId]);

  const fetchTransaction = async (id: string) => {
    if (!id) {
      console.error("No transaction ID provided");
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No transaction ID provided',
        position: 'bottom',
      });
      router.back();
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching transaction with ID:", id);
      const data = await api.fetchTransaction(id);
      console.log("Fetched transaction data:", JSON.stringify(data, null, 2));
      
      // Store the Django ID (primary key) which is needed for updates
      const djangoId = data.id;
      console.log("Setting Django primary key (id):", djangoId);
      setDjangoPrimaryKey(djangoId);
      
      // Map response data to form state
      setMerchantName(data.merchant_name || '');
      setAmount(data.amount.toString());
      setDescription(data.description || '');
      setIsExpense(data.is_expense);
      
      // Store both IDs
      if (data.transaction_id) {
        console.log("Custom transaction_id:", data.transaction_id);
        setOriginalTransactionId(data.transaction_id);
      } else {
        console.log("No transaction_id in response, using URL param:", id);
        setOriginalTransactionId(id);
      }
      
      // Handle category and subcategory
      if (typeof data.category === 'object' && data.category) {
        setCategory(data.category.id);
      } else if (typeof data.category === 'string') {
        setCategory(data.category);
      }
      
      if (typeof data.subcategory === 'object' && data.subcategory) {
        setSubcategory(data.subcategory.id);
      } else if (typeof data.subcategory === 'string') {
        setSubcategory(data.subcategory);
      }
      
      // Handle date and time
        if (data.time_of_transaction) {
        // If we have the ISO format time_of_transaction, use it
        setTimeOfTransaction(data.time_of_transaction);
        try {
          const parsedDate = new Date(data.time_of_transaction);
          if (!isNaN(parsedDate.getTime())) {
            setDate(parsedDate);
          }
        } catch (error) {
          console.error("Error parsing time_of_transaction:", error);
        }
      } else if (data.date) {
        // Fall back to just the date if time_of_transaction isn't available
        try {
          const parsedDate = new Date(data.date);
          if (!isNaN(parsedDate.getTime())) {
            setDate(parsedDate);
          }
        } catch (error) {
          console.error("Error parsing date:", error);
        }
      }
      
      // Fetch categories for the form
      await fetchCategories();
      
    } catch (error) {
      console.error('Error fetching transaction:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load transaction',
        position: 'bottom',
      });
      router.back(); // Go back if we can't load the transaction
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesData = await api.fetchCategories();
      console.log("Fetched categories data:", categoriesData);
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load categories"
      });
      setCategories([]);
    }
  };

  // Filter subcategories
  const filteredSubcategories = subcategories.filter(sub => {
    if (!category) return false;
    const subCategoryId = sub.category_id;
    return subCategoryId === category;
  });

  const handleCategoryChange = async (itemValue: string) => {
    console.log("Category selected:", itemValue);
    setCategory(itemValue);
    setSubcategory(null); // Reset subcategory when category changes

    // Only fetch subcategories if we have a valid category ID
    if (itemValue && itemValue !== "null" && itemValue !== "undefined") {
      try {
        const subcategoriesData = await api.fetchSubCategories(itemValue);
        console.log("Fetched subcategories data:", subcategoriesData);
        if (Array.isArray(subcategoriesData)) {
          // Add category_id to each subcategory for easier filtering
          const processedData = subcategoriesData.map(sub => ({
            ...sub,
            category_id: itemValue
          }));
          setSubcategories(processedData);
        } else {
          setSubcategories([]);
        }
      } catch (error) {
        console.error("Error fetching subcategories:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load subcategories"
        });
        setSubcategories([]);
      }
    } else {
      setSubcategories([]);
    }
  };

  const handleUpdate = async () => {
    if (!description || !amount) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    if (isNaN(parseFloat(amount))) {
      Alert.alert("Error", "Invalid amount. Please enter a valid number.");
      return;
    }

    // Format date in ISO format for the backend
    const isoDateTime = date.toISOString();

    // Use the Django primary key for the update, not the transaction_id
    // This is the key issue - we need the Django ID for the API endpoint
    const idForUpdate = djangoPrimaryKey || transactionId;
    
    if (!idForUpdate) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Transaction ID not found"
      });
      return;
    }

    const updatedTransaction: Transaction = {
      id: idForUpdate,
      merchant_name: merchantName,
      amount: parseFloat(amount),
      description: description,
      category_id: category || undefined,
      subcategory_id: subcategory || undefined,
      time_of_transaction: isoDateTime,
      isExpense: isExpense,
      date: isoDateTime.split('T')[0],
      transaction_id: originalTransactionId || undefined, // Keep the original transaction_id
    };

    console.log("Updating transaction with Django ID:", idForUpdate);
    console.log("Updating transaction with data:", updatedTransaction);

    try {
      await api.updateTransaction(idForUpdate, updatedTransaction);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Transaction successfully updated"
      });
      router.back();
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      
      // Improved error reporting
      let errorMessage = "Failed to update transaction";
      if (error.response && error.response.data) {
        if (error.response.data.detail) {
          errorMessage += `: ${error.response.data.detail}`;
        } else {
          errorMessage += `. Server response: ${JSON.stringify(error.response.data)}`;
        }
      }
      
      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMessage
      });
    }
  };

  const handleDelete = async () => {
    console.log("Delete button pressed, djangoPrimaryKey:", djangoPrimaryKey);
    try {
      if (!djangoPrimaryKey) {
        const error = "Django primary key not found";
        console.error(error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error,
          position: 'top',
          visibilityTime: 3000,
          autoHide: true,
          topOffset: 50
        });
        return;
      }
      
      console.log("Making delete API call to:", `/api/expenses/transactions/${djangoPrimaryKey}/`);
      await api.deleteTransaction(djangoPrimaryKey);
      console.log("API call successful");
      
      // Show success message with full configuration
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Transaction deleted successfully',
        visibilityTime: 2000,
        position: 'top',
        autoHide: true,
        topOffset: 50,
        onShow: () => {
          console.log('Toast shown');
          // Add delay before navigation
          setTimeout(() => {
            console.log('Navigating to home');
            router.replace('/');
          }, 1500); // Navigate after 1.5 seconds
        }
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error("Error deleting transaction:", error);
      console.error("Error details:", errorMessage);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `Failed to delete transaction: ${errorMessage}`,
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 50
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading transaction details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header showBackButton={true} />

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Edit Transaction</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Merchant Name (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Merchant Name"
            value={merchantName}
            onChangeText={setMerchantName}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={category || ""}
              onValueChange={handleCategoryChange}
              style={styles.picker}
            >
              <Picker.Item label="Select a category" value="" />
              {categories.map((cat) => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
              ))}
            </Picker>
          </View>
        </View>

        {category && filteredSubcategories.length > 0 && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Subcategory</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={subcategory || ""}
                onValueChange={(itemValue: string) => {
                  // Convert empty string to null for consistency in the state
                  const subcategoryValue = itemValue === "" ? null : itemValue;
                  setSubcategory(subcategoryValue);
                }}
                style={styles.picker}
              >
                <Picker.Item label="Select a subcategory" value="" />
                {filteredSubcategories.map((sub) => (
                  <Picker.Item key={sub.id} label={sub.name} value={sub.id} />
                ))}
              </Picker>
            </View>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Transaction Type</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                isExpense && styles.activeTypeButton
              ]}
              onPress={() => setIsExpense(true)}
            >
              <Text style={[
                styles.typeButtonText,
                isExpense && styles.activeTypeButtonText
              ]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                !isExpense && styles.activeTypeButton
              ]}
              onPress={() => setIsExpense(false)}
            >
              <Text style={[
                styles.typeButtonText,
                !isExpense && styles.activeTypeButtonText
              ]}>Income</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdate}
          >
            <Text style={styles.updateButtonText}>Update Transaction</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}>Delete Transaction</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  typeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    alignItems: "center",
    marginHorizontal: 5,
    borderRadius: 8,
  },
  activeTypeButton: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  typeButtonText: {
    fontSize: 16,
    color: "#666",
  },
  activeTypeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  buttonContainer: {
    marginTop: 20,
  },
  updateButton: {
    backgroundColor: "#2196F3",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#f44336",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default EditTransactionScreen; 