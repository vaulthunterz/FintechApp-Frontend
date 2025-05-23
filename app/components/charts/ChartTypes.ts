/**
 * Shared types and interfaces for chart components
 */
import { Dimensions } from 'react-native';

// Chart type definitions
export type ChartType = 'line' | 'bar' | 'pie' | 'donut' | 'timeSeries';

// Common chart data interfaces
export interface BarChartData {
  x: string;
  y: number;
}

export interface TimeSeriesData {
  x: string | Date;
  y: number;
}

export interface ExpenseData {
  category: string;
  amount: number;
  color: string;
}

export interface LegendItem {
  name: string;
  color: string;
}

// Common chart props
export interface BaseChartProps {
  title: string;
  width?: number;
  height?: number;
}

export interface AxisChartProps extends BaseChartProps {
  yAxisLabel?: string;
  xAxisLabel?: string;
}

export interface ColoredChartProps extends BaseChartProps {
  colors?: string[];
}

// Specific chart props
export interface BarChartProps extends AxisChartProps, ColoredChartProps {
  data: BarChartData[];
}

export interface DonutChartProps extends ColoredChartProps {
  data: BarChartData[];
}

export interface PieChartProps extends ColoredChartProps {
  data: BarChartData[];
  innerRadius?: number;
  labelRadius?: number;
  padAngle?: number;
}

export interface LineChartProps extends TimeSeriesChartProps {
  // Line chart specific props can be added here
}

export interface TimeSeriesChartProps extends AxisChartProps, ColoredChartProps {
  data: TimeSeriesData[][];
  legendItems?: LegendItem[];
  showPoints?: boolean;
}

export interface ExpenseChartProps {
  data: ExpenseData[];
  title: string;
  type: 'pie' | 'bar';
  period?: string;
}

// Default values
export const DEFAULT_CHART_WIDTH = Dimensions.get('window').width - 40;
export const DEFAULT_CHART_HEIGHT = 300;
export const DEFAULT_COLORS = ['#1976D2', '#F44336', '#4CAF50', '#FF9800', '#9C27B0', '#795548'];

// Default export for Expo Router
const ChartTypesExport = {
  ChartTypes: {
    LINE: 'line',
    BAR: 'bar',
    PIE: 'pie',
    DONUT: 'donut',
    TIME_SERIES: 'timeSeries'
  },
  DEFAULT_CHART_WIDTH,
  DEFAULT_CHART_HEIGHT,
  DEFAULT_COLORS
};

export default ChartTypesExport;
