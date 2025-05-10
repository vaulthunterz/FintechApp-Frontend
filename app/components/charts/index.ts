// Export types from ChartTypes
import type {
  ChartType,
  BarChartData,
  TimeSeriesData,
  ExpenseData,
  HeatMapData,
  LegendItem,
  BaseChartProps,
  AxisChartProps,
  ColoredChartProps,
  BarChartProps,
  DonutChartProps,
  TimeSeriesChartProps,
  AreaChartProps,
  HeatMapProps,
  ExpenseChartProps
} from './ChartTypes';

// Export platform-specific components
import {
  BarChartComponent,
  DonutChartComponent,
  TimeSeriesChartComponent,
  AreaChartComponent,
  PlatformExpenseChart,
  ChartSelector
} from './PlatformCharts';

// Export Gifted Charts implementations
import {
  GiftedBarChart,
  GiftedDonutChart,
  GiftedTimeSeriesChart,
  GiftedAreaChart,
  GiftedExpenseChart
} from './GiftedCharts';

// Export Web Charts implementations
import {
  WebBarChart,
  WebDonutChart,
  WebTimeSeriesChart,
  WebAreaChart,
  WebExpenseChart
} from './WebCharts';

// Named exports
export {
  // Platform-specific components
  BarChartComponent,
  DonutChartComponent,
  TimeSeriesChartComponent,
  AreaChartComponent,
  PlatformExpenseChart as ExpenseChart,
  ChartSelector,

  // Gifted Charts implementations
  GiftedBarChart,
  GiftedDonutChart,
  GiftedTimeSeriesChart,
  GiftedAreaChart,
  GiftedExpenseChart,

  // Web Charts implementations
  WebBarChart,
  WebDonutChart,
  WebTimeSeriesChart,
  WebAreaChart,
  WebExpenseChart
};

// Export types
export type {
  ChartType,
  BarChartData,
  TimeSeriesData,
  ExpenseData,
  HeatMapData,
  LegendItem,
  BaseChartProps,
  AxisChartProps,
  ColoredChartProps,
  BarChartProps,
  DonutChartProps,
  TimeSeriesChartProps,
  AreaChartProps,
  HeatMapProps,
  ExpenseChartProps
};

// Default export (required by Expo Router)
const ChartComponents = {
  BarChartComponent,
  DonutChartComponent,
  TimeSeriesChartComponent,
  AreaChartComponent,
  ExpenseChart: PlatformExpenseChart,
  ChartSelector,
  GiftedBarChart,
  GiftedDonutChart,
  GiftedTimeSeriesChart,
  GiftedAreaChart,
  GiftedExpenseChart,
  WebBarChart,
  WebDonutChart,
  WebTimeSeriesChart,
  WebAreaChart,
  WebExpenseChart
};

export default ChartComponents;
