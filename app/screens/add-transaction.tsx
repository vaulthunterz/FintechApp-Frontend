import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from "date-fns";
import DrawerMenu from "../components/DrawerMenu";

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

interface Prediction {
  category_name: string;
  subcategory_name?: string;
  confidence?: number;
  model_type: 'gemini' | 'custom';
}

const AddTransactionScreen = () => {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [merchantName, setMerchantName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [isExpense, setIsExpense] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [date, setDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
  const [isValidating, setIsValidating] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [pendingSubcategoryId, setPendingSubcategoryId] = useState<string | null>(null);

  // Handle SMS transaction data if provided via params
  useEffect(() => {
    if (params.merchant && params.amount && params.transactionId) {
      // Set transaction data from SMS
      setMerchantName(params.merchant as string);
      setAmount(params.amount as string);
      setDescription(`Transaction ID: ${params.transactionId as string}`);
      setIsExpense(true); // Assuming SMS transactions are expenses

      // If date and time are provided, parse them
      if (params.date && params.time) {
        try {
          const dateStr = params.date as string;
          const timeStr = params.time as string;
          const dateTimeStr = `${dateStr} ${timeStr}`;
          const newDate = new Date(dateTimeStr);
          if (!isNaN(newDate.getTime())) {
            setDate(newDate);
          }
        } catch (error) {
          console.error("Error parsing date/time from SMS:", error);
        }
      }

      // Try to predict category based on merchant name and description
      if (token) {
        predictCategory('gemini');
      }
    }
  }, [params, token]);

  useEffect(() => {
    if (user) {
      // Get token from Firebase
      const currentUser = auth.currentUser;
      if (currentUser) {
        currentUser.getIdToken().then((tkn: string) => {
          setToken(tkn);
          fetchCategories();
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
        fetchCategories(); // Try to fetch categories anyway
      }
    }
  }, [user]);

  useEffect(() => {
    const fetchSubcategoriesForCategory = async () => {
      if (category) {
        try {
          const subcategoriesData = await api.fetchSubCategories(category);
          if (Array.isArray(subcategoriesData)) {
            const processedData = subcategoriesData.map((sub) => ({
              ...sub,
              category_id: category,
              name: typeof sub.name === 'string'
                ? sub.name
                : (sub.name ? String(sub.name) : `Subcategory ${sub.id}`)
            }));
            setSubcategories(processedData);

            // If there's a pending subcategory ID, set it now
            if (pendingSubcategoryId) {
              setSubcategory(pendingSubcategoryId);
              setPendingSubcategoryId(null);
            } else {
              // Reset subcategory if there's no pending ID
              setSubcategory(null);
            }
          }
        } catch (error) {
          console.error("Error fetching subcategories:", error);
          setSubcategories([]);
          setSubcategory(null);
        }
      } else {
        setSubcategories([]);
        setSubcategory(null);
      }
    };

    fetchSubcategoriesForCategory();
  }, [category]);

  const fetchCategories = async () => {
    try {
      const response = await api.fetchCategories();
      console.log("Categories response:", response);

      if (Array.isArray(response)) {
        // Check each category to ensure name is a string
        const validCategories = response.map(cat => {
          console.log("Category object:", cat);
          // Ensure name is a string
          if (typeof cat.name !== 'string') {
            console.warn(`Category with id ${cat.id} has non-string name:`, cat.name);
            return {
              ...cat,
              name: cat.name ? String(cat.name) : `Category ${cat.id}`
            };
          }
          return cat;
        });
        setCategories(validCategories);
      } else {
        console.error("Unexpected categories format:", response);
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to fetch categories",
      });
    }
  };

  const handleCategoryChange = (itemValue: string) => {
    console.log("Category selected:", itemValue);
    const categoryValue = itemValue === "" ? null : itemValue;
    setCategory(categoryValue);
    // Subcategories will be fetched by the useEffect
  };

  const predictCategory = async (modelType: 'gemini' | 'custom') => {
    if (!description.trim()) {
      Toast.show({
        type: "info",
        text1: "Info",
        text2: "Please enter a description first",
      });
      return;
    }

    if (modelType === 'custom' && !merchantName.trim()) {
      Toast.show({
        type: "info",
        text1: "Info",
        text2: "Merchant name is required for custom model prediction",
      });
      return;
    }

    try {
      setIsPredicting(true);
      let predictionResponse;

      if (modelType === 'gemini') {
        predictionResponse = await api.getGeminiPrediction(description);
      } else {
        predictionResponse = await api.getCustomPrediction(description, merchantName);
      }

      console.log(`${modelType} prediction response:`, predictionResponse);

      if (predictionResponse && predictionResponse.category_id) {
        const categoryId = String(predictionResponse.category_id);
        const subcategoryId = predictionResponse.subcategory_id ? String(predictionResponse.subcategory_id) : null;

        console.log("Setting category ID:", categoryId);
        console.log("Setting subcategory ID:", subcategoryId);

        // Store the subcategory ID before changing the category
        if (subcategoryId) {
          setPendingSubcategoryId(subcategoryId);
        }

        // Set the category - this will trigger the useEffect to fetch subcategories
        setCategory(categoryId);

        // Set prediction data for display
        setPrediction({
          category_name: predictionResponse.category_name,
          subcategory_name: predictionResponse.subcategory_name,
          confidence: predictionResponse.confidence,
          model_type: modelType
        });

        Toast.show({
          type: "success",
          text1: "Success",
          text2: `Category predicted using ${modelType === 'gemini' ? 'AI' : 'Custom'} model`,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Invalid prediction response",
        });
      }
    } catch (error) {
      console.error(`Error predicting category with ${modelType} model:`, error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: `Failed to predict category with ${modelType === 'gemini' ? 'AI' : 'Custom'} model`,
      });
      setCategory(null);
      setSubcategory(null);
      setPendingSubcategoryId(null);
      setSubcategories([]);
    } finally {
      setIsPredicting(false);
    }
  };

  const showDatePicker = (mode: 'date' | 'time') => {
    setDatePickerMode(mode);
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setDatePickerVisible(false);
    if (selectedDate) {
      if (datePickerMode === 'time') {
        const currentDate = new Date(date);
        currentDate.setHours(selectedDate.getHours());
        currentDate.setMinutes(selectedDate.getMinutes());
        setDate(currentDate);
      } else {
        setDate(selectedDate);
      }
    }
  };

  const handleSubmit = async () => {
    // Validate inputs
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Toast.show({
        type: "error",
        text1: "Invalid Amount",
        text2: "Please enter a valid positive amount",
        position: "bottom",
      });
      return;
    }

    if (!description.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing Description",
        text2: "Please enter a description for the transaction",
        position: "bottom",
      });
      return;
    }

    if (!category) {
      Toast.show({
        type: "error",
        text1: "Missing Category",
        text2: "Please select or predict a category",
        position: "bottom",
      });
      return;
    }

    try {
      setLoading(true);

      // Generate a transaction ID (UUID v4-like format)
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const transaction_id = generateUUID();

      // Format date and time in ISO format
      const isoDateTime = date.toISOString(); // This creates a YYYY-MM-DDThh:mm:ss.sssZ format

      // Construct transaction data object
      const transactionData = {
        transaction_id: transaction_id,
        merchant_name: merchantName.trim(),
        amount: parseFloat(amount),
        description: description.trim(),
        category_id: category,
        subcategory_id: subcategory,
        is_expense: isExpense,
        date: format(date, "yyyy-MM-dd"),
        time_of_transaction: isoDateTime,
      };

      console.log("Submitting transaction with data:", transactionData);

      // Submit transaction
      await api.addTransaction(transactionData);

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Transaction added successfully",
        position: "bottom",
      });

      // Clear form
      setMerchantName("");
      setAmount("");
      setDescription("");
      setCategory(null);
      setSubcategory(null);
      setPrediction(null);
      setDate(new Date());

      // Navigate back to transactions screen
      router.push("/screens/transactions");
    } catch (error) {
      console.error("Error adding transaction:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to add transaction. Please try again.",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleDrawer = () => {
    setDrawerVisible(!drawerVisible);
  };

  return (
    <View style={styles.container}>
      <Header showBackButton={true} isRootScreen={true} onMenuPress={toggleDrawer} />
      <DrawerMenu isVisible={drawerVisible} onClose={toggleDrawer} />

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Add New Transaction</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Merchant Name (Optional)</Text>
          <TextInput
            style={styles.input}
            value={merchantName}
            onChangeText={setMerchantName}
            placeholder="Enter merchant name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
            placeholderTextColor="#999"
            multiline
          />
          <View style={styles.predictionContainer}>
            <TouchableOpacity
              style={[styles.predictButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => predictCategory('gemini')}
              disabled={isPredicting}
            >
              {isPredicting && prediction?.model_type === 'gemini' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>AI Predict</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.predictButton, { backgroundColor: '#2196F3' }]}
              onPress={() => predictCategory('custom')}
              disabled={isPredicting}
            >
              {isPredicting && prediction?.model_type === 'custom' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Custom Predict</Text>
              )}
            </TouchableOpacity>
          </View>
          {prediction && (
            <View style={styles.predictionResult}>
              <Text style={styles.predictionTitle}>
                {prediction.model_type === 'gemini' ? 'AI' : 'Custom'} Prediction:
              </Text>
              <Text style={styles.predictionText}>
                {prediction.category_name}
                {prediction.subcategory_name && ` - ${prediction.subcategory_name}`}
              </Text>
              {prediction.confidence && (
                <Text style={styles.confidenceText}>
                  Confidence: {(prediction.confidence * 100).toFixed(1)}%
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity style={styles.datePickerButton} onPress={() => showDatePicker('date')}>
            <Text style={styles.datePickerButtonText}>
              {format(date, 'MMM dd, yyyy')}
            </Text>
          </TouchableOpacity>
        </View>

        {isDatePickerVisible && (
          <DateTimePicker
            value={date}
            mode={datePickerMode}
            onChange={handleDateChange}
          />
        )}

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
                <Picker.Item
                  key={cat.id}
                  label={cat.name}
                  value={cat.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Subcategory</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={subcategory || ""}
              onValueChange={(itemValue) => {
                const subcategoryValue = itemValue === "" ? null : itemValue;
                setSubcategory(subcategoryValue);
              }}
              style={styles.picker}
            >
              <Picker.Item label="Select a subcategory" value="" />
              {subcategories
                .filter(sub => sub.category_id === category)
                .map((sub) => (
                  <Picker.Item
                    key={sub.id}
                    label={sub.name}
                    value={sub.id}
                  />
                ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Transaction Type</Text>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, isExpense ? styles.activeType : {}]}>Expense</Text>
            <Switch
              value={!isExpense}
              onValueChange={(value) => setIsExpense(!value)}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={isExpense ? "#f4f3f4" : "#2196F3"}
            />
            <Text style={[styles.switchLabel, !isExpense ? styles.activeType : {}]}>Income</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Add Transaction</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      <Toast />
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
  predictionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  predictButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  predictionResult: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  predictionTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  predictionText: {
    fontSize: 16,
    color: '#444',
    marginBottom: 3,
  },
  confidenceText: {
    color: '#666',
    fontStyle: 'italic',
    fontSize: 14,
  },
  datePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  datePickerButtonText: {
    fontSize: 16,
    color: "#333",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
    marginTop: 5,
  },
  picker: {
    backgroundColor: '#fff',
    height: 50,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  switchLabel: {
    fontSize: 16,
    marginHorizontal: 8,
    color: "#666",
  },
  activeType: {
    fontWeight: "bold",
    color: "#2196F3",
  },
  submitButton: {
    backgroundColor: "#2196F3",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AddTransactionScreen;