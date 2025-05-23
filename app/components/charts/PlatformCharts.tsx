/**
 * Platform-specific chart components that render the appropriate implementation
 * based on the current platform (web or native)
 */
import React from 'react';
import { Platform } from 'react-native';
import {
  BarChartProps,
  DonutChartProps,
  TimeSeriesChartProps,
  ExpenseChartProps
} from './ChartTypes';

// Import Gifted Charts implementations
import {
  GiftedBarChart,
  GiftedDonutChart,
  GiftedTimeSeriesChart,
  GiftedExpenseChart
} from './GiftedCharts';

// Import Web Charts implementations
import {
  WebBarChart,
  WebDonutChart,
  WebTimeSeriesChart,
  WebExpenseChart
} from './WebCharts';

// ==================== Bar Chart ====================
export const BarChartComponent: React.FC<BarChartProps> = (props) => {
  return Platform.OS === 'web'
    ? <WebBarChart {...props} />
    : <GiftedBarChart {...props} />;
};

// ==================== Donut Chart ====================
export const DonutChartComponent: React.FC<DonutChartProps> = (props) => {
  return Platform.OS === 'web'
    ? <WebDonutChart {...props} />
    : <GiftedDonutChart {...props} />;
};

// ==================== Time Series Chart ====================
export const TimeSeriesChartComponent: React.FC<TimeSeriesChartProps> = (props) => {
  return Platform.OS === 'web'
    ? <WebTimeSeriesChart {...props} />
    : <GiftedTimeSeriesChart {...props} />;
};

// ==================== Expense Chart ====================
export const PlatformExpenseChart: React.FC<ExpenseChartProps> = (props) => {
  return Platform.OS === 'web'
    ? <WebExpenseChart {...props} />
    : <GiftedExpenseChart {...props} />;
};

// Re-export the chart selector
export { default as ChartSelector } from './ChartSelector';

// Default export for Expo Router
const PlatformCharts = {
  BarChartComponent,
  DonutChartComponent,
  TimeSeriesChartComponent,
  PlatformExpenseChart,
  ChartSelector: require('./ChartSelector').default
};

export default PlatformCharts;
