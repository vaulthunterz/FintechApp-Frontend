// Import chart components
import BarChart from './BarChart';
import LineChart from './LineChart';
import PieChart from './PieChart';
import DonutChart from './DonutChart';
import TimeSeriesChart from './TimeSeriesChart';
import ChartSelector from './ChartSelector';
import FinancialDataVisualizer from './FinancialDataVisualizer';
import * as WebCharts from './WebCharts';

// Export components
export {
  BarChart,
  LineChart,
  PieChart,
  DonutChart,
  TimeSeriesChart,
  ChartSelector,
  FinancialDataVisualizer,
  WebCharts
};

// Export types
export type {
  ChartType,
  BarChartData,
  TimeSeriesData,
  ExpenseData,
  LegendItem,
  BaseChartProps,
  AxisChartProps,
  ColoredChartProps,
  BarChartProps,
  DonutChartProps,
  TimeSeriesChartProps,
  ExpenseChartProps,
  LineChartProps,
  PieChartProps
} from './ChartTypes';

// Default export for backward compatibility
const ChartComponents = {
  BarChart,
  LineChart,
  PieChart,
  DonutChart,
  TimeSeriesChart,
  ChartSelector,
  FinancialDataVisualizer
};

export default ChartComponents;
