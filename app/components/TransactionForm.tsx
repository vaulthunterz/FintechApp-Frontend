import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Input, Button, Text, Card, Icon, Divider } from '@rneui/themed';
import { useTheme } from '../contexts/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';

interface TransactionFormProps {
  initialData?: {
    transactionId?: string;
    merchant?: string;
    amount?: string;
    date?: string;
    time?: string;
    description?: string;
    category?: string;
  };
  onSubmit: (data: any) => Promise<void>;
  isEditing?: boolean;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  initialData = {}, 
  onSubmit,
  isEditing = false
}) => {
  const { colors } = useTheme();
  
  // Form state
  const [merchant, setMerchant] = useState(initialData.merchant || '');
  const [amount, setAmount] = useState(initialData.amount || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [category, setCategory] = useState(initialData.category || '');
  const [transactionId] = useState(initialData.transactionId || `txn-${Date.now()}`);
  
  // Date and time state
  const initialDate = initialData.date ? new Date(initialData.date) : new Date();
  const [date, setDate] = useState(initialDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Loading state
  const [loading, setLoading] = useState(false);
  
  // Categories
  const categories = [
    'Food', 'Transport', 'Entertainment', 'Shopping', 
    'Utilities', 'Health', 'Education', 'Other'
  ];
  
  // Handle date change
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    if (!merchant.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a merchant name',
      });
      return;
    }
    
    if (!amount.trim() || isNaN(Number(amount))) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid amount',
      });
      return;
    }
    
    if (!category) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a category',
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare data
      const transactionData = {
        transactionId,
        merchant,
        amount: parseFloat(amount),
        date: date.toISOString(),
        description,
        category,
      };
      
      // Submit data
      await onSubmit(transactionData);
      
      // Show success message
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: isEditing ? 'Transaction updated successfully' : 'Transaction added successfully',
      });
      
      // Navigate back
      router.back();
    } catch (error) {
      console.error('Error submitting transaction:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save transaction',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Card containerStyle={[styles.card, { backgroundColor: colors.card }]}>
        <Card.Title style={{ color: colors.text }}>
          {isEditing ? 'Edit Transaction' : 'Add Transaction'}
        </Card.Title>
        <Card.Divider />
        
        <Input
          placeholder="Merchant"
          value={merchant}
          onChangeText={setMerchant}
          leftIcon={<Icon name="store" type="material" color={colors.primary} />}
          inputStyle={{ color: colors.text }}
          placeholderTextColor={colors.textSecondary}
        />
        
        <Input
          placeholder="Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          leftIcon={<Icon name="attach-money" type="material" color={colors.primary} />}
          inputStyle={{ color: colors.text }}
          placeholderTextColor={colors.textSecondary}
        />
        
        <TouchableOpacity 
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Icon name="calendar" type="material-community" color={colors.primary} />
          <Text style={[styles.dateText, { color: colors.text }]}>
            {formatDate(date)}
          </Text>
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
        
        <Input
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
          leftIcon={<Icon name="description" type="material" color={colors.primary} />}
          inputStyle={{ color: colors.text }}
          placeholderTextColor={colors.textSecondary}
          multiline
        />
        
        <Text style={[styles.categoryLabel, { color: colors.text }]}>
          Category
        </Text>
        
        <View style={styles.categoryContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                { 
                  backgroundColor: category === cat ? colors.primary : colors.card,
                  borderColor: colors.primary
                }
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text style={{ 
                color: category === cat ? '#fff' : colors.primary,
                fontWeight: category === cat ? 'bold' : 'normal'
              }}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Divider style={styles.divider} />
        
        <Button
          title={isEditing ? "Update Transaction" : "Add Transaction"}
          onPress={handleSubmit}
          loading={loading}
          buttonStyle={[styles.submitButton, { backgroundColor: colors.primary }]}
          icon={<Icon name="check" type="material" color="#fff" style={styles.submitIcon} />}
        />
        
        <Button
          title="Cancel"
          onPress={() => router.back()}
          type="outline"
          buttonStyle={styles.cancelButton}
          titleStyle={{ color: colors.error }}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 20,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateText: {
    marginLeft: 10,
    fontSize: 16,
  },
  categoryLabel: {
    marginLeft: 10,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 10,
    marginBottom: 20,
  },
  categoryButton: {
    padding: 8,
    margin: 4,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  divider: {
    marginVertical: 20,
  },
  submitButton: {
    borderRadius: 8,
    marginBottom: 10,
  },
  submitIcon: {
    marginRight: 10,
  },
  cancelButton: {
    borderRadius: 8,
    borderColor: '#ff6b6b',
  },
});

export default TransactionForm;
