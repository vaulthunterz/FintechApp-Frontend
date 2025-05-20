import { API_BASE_URL } from '../config';
import { getAuthToken } from '../utils/authUtils';
import { MPESATransaction, TransactionPaginatedResponse } from '../types/transaction';

export const predictTransaction = async (transaction: Partial<MPESATransaction>): Promise<MPESATransaction> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions/predict/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify({
        merchant_name: transaction.merchant_name,
        amount: transaction.amount,
        description: transaction.description,
        full_message: transaction.full_message,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const predictions = await response.json();
    return {
      ...transaction,
      category: predictions.category,
      subcategory: predictions.subcategory,
      confidence: predictions.confidence,
    } as MPESATransaction;
  } catch (error) {
    console.error('Error getting predictions:', error);
    throw error;
  }
};

export const processTransaction = async (transaction: Partial<MPESATransaction>): Promise<MPESATransaction> => {
  try {
    // First get predictions
    const predictedTransaction = await predictTransaction(transaction);

    // Then store the transaction with predictions
    const response = await fetch(`${API_BASE_URL}/api/transactions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify({
        transaction_id: predictedTransaction.transaction_id,
        merchant_name: predictedTransaction.merchant_name,
        amount: predictedTransaction.amount,
        description: predictedTransaction.description,
        time_of_transaction: predictedTransaction.time_of_transaction,
        is_expense: predictedTransaction.is_expense,
        category_id: predictedTransaction.category?.id,
        subcategory_id: predictedTransaction.subcategory?.id,
        confidence: predictedTransaction.confidence,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error processing transaction:', error);
    throw error;
  }
};

export const batchProcessTransactions = async (transactions: Partial<MPESATransaction>[]): Promise<MPESATransaction[]> => {
  try {
    // First get predictions for all transactions
    const predictedTransactions = await Promise.all(
      transactions.map(transaction => predictTransaction(transaction))
    );

    // Then store all transactions with their predictions
    const processedTransactions = await Promise.all(
      predictedTransactions.map(transaction => processTransaction(transaction))
    );

    return processedTransactions;
  } catch (error) {
    console.error('Error processing batch transactions:', error);
    throw error;
  }
};

export const getRecentTransactions = async (limit: number = 20): Promise<TransactionPaginatedResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/transactions/?page_size=${limit}`, 
      {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    throw error;
  }
};

export const deleteTransaction = async (transactionId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions/${transactionId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

export const updateTransaction = async (transaction: MPESATransaction): Promise<MPESATransaction> => {
  try {
    // First get new predictions if merchant or amount changed
    let updatedTransaction = transaction;
    if (transaction.merchant_name || transaction.amount) {
      updatedTransaction = await predictTransaction(transaction);
    }

    const response = await fetch(`${API_BASE_URL}/api/transactions/${transaction.id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify({
        transaction_id: updatedTransaction.transaction_id,
        merchant_name: updatedTransaction.merchant_name,
        amount: updatedTransaction.amount,
        description: updatedTransaction.description,
        time_of_transaction: updatedTransaction.time_of_transaction,
        is_expense: updatedTransaction.is_expense,
        category_id: updatedTransaction.category?.id,
        subcategory_id: updatedTransaction.subcategory?.id,
        confidence: updatedTransaction.confidence,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
}; 