export interface Category {
  id: number;
  name: string;
}

export interface SubCategory {
  id: number;
  name: string;
  category_id: number;
}

export interface User {
  id: number;
  username: string;
}

export interface MPESATransaction {
  id?: string; // Optional as it's auto-generated
  transaction_id: string;
  merchant_name: string;
  amount: number; // Changed to number to match backend decimal
  description: string;
  time_of_transaction: string; // ISO date string
  is_expense: boolean;
  category?: Category;
  subcategory?: SubCategory;
  user?: User;
  // Additional MPESA-specific fields
  phone?: string;
  full_message?: string;
  confidence?: number;
}

export interface TransactionPaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
  page_total_amount: number;
  results: MPESATransaction[];
} 