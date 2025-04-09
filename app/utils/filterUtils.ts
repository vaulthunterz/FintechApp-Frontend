import { isWithinInterval, parseISO } from 'date-fns';
import { FilterOptions } from '../components/filters/FilterControls';

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

/**
 * Filter transactions based on the provided filter options
 */
export const filterTransactions = (
  transactions: Transaction[],
  filters: FilterOptions
): Transaction[] => {
  return transactions.filter(transaction => {
    // Apply date filter
    if (filters.startDate && filters.endDate) {
      const transactionDate = transaction.time_of_transaction 
        ? parseISO(transaction.time_of_transaction) 
        : transaction.date 
          ? parseISO(transaction.date) 
          : null;
      
      if (transactionDate) {
        try {
          const isWithinDateRange = isWithinInterval(transactionDate, {
            start: filters.startDate,
            end: filters.endDate
          });
          
          if (!isWithinDateRange) {
            return false;
          }
        } catch (error) {
          // If there's an error with the date comparison, don't filter out the transaction
          console.warn('Error comparing dates:', error);
        }
      }
    }
    
    // Apply category filter
    if (filters.categories.length > 0) {
      const categoryName = typeof transaction.category === 'string'
        ? transaction.category
        : transaction.category?.name || 'Uncategorized';
      
      if (!filters.categories.includes(categoryName)) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * Extract unique categories from transactions
 */
export const extractCategories = (transactions: Transaction[]): string[] => {
  const categories = new Set<string>();
  
  transactions.forEach(transaction => {
    const categoryName = typeof transaction.category === 'string'
      ? transaction.category
      : transaction.category?.name || 'Uncategorized';
    
    categories.add(categoryName);
  });
  
  return Array.from(categories).sort();
};

/**
 * Get default filter options
 */
export const getDefaultFilters = (): FilterOptions => {
  return {
    timePeriod: 'all',
    startDate: null,
    endDate: null,
    categories: []
  };
};
