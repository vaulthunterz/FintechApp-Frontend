import React from 'react';
import { Platform } from 'react-native';
import ExpenseChart from '../ExpenseChart';
import WebExpenseChart from './WebExpenseChart';

interface ExpenseData {
  category: string;
  amount: number;
  color: string;
}

interface PlatformExpenseChartProps {
  data: ExpenseData[];
  title: string;
  type: 'pie' | 'bar';
  period?: string;
}

/**
 * Platform-specific chart component that renders the appropriate chart based on platform
 */
const PlatformExpenseChart: React.FC<PlatformExpenseChartProps> = (props) => {
  // Use WebExpenseChart for web platform, ExpenseChart for native platforms
  return Platform.OS === 'web' 
    ? <WebExpenseChart {...props} /> 
    : <ExpenseChart {...props} />;
};

export default PlatformExpenseChart;
