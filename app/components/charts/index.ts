import BarChartComponent from './BarChartComponent';
import AreaChartComponent from './AreaChartComponent';
import DonutChartComponent from './DonutChartComponent';
import TimeSeriesChartComponent from './TimeSeriesChartComponent';
import HeatMapComponent from './HeatMapComponent';
import ChartSelector from './ChartSelector';
import type { ChartType } from './ChartSelector';

// Import Gifted Chart components
import GiftedBarChart from './GiftedBarChart';
import GiftedAreaChart from './GiftedAreaChart';
import GiftedDonutChart from './GiftedDonutChart';
import GiftedTimeSeriesChart from './GiftedTimeSeriesChart';
import GiftedHeatMapComponent from './GiftedHeatMapComponent';

// Named exports
export {
  BarChartComponent,
  AreaChartComponent,
  DonutChartComponent,
  TimeSeriesChartComponent,
  HeatMapComponent,
  ChartSelector,
  GiftedBarChart,
  GiftedAreaChart,
  GiftedDonutChart,
  GiftedTimeSeriesChart,
  GiftedHeatMapComponent
};
export type { ChartType };

// Default export (required by Expo Router)
export default {
  BarChartComponent,
  AreaChartComponent,
  DonutChartComponent,
  TimeSeriesChartComponent,
  HeatMapComponent,
  ChartSelector,
  GiftedBarChart,
  GiftedAreaChart,
  GiftedDonutChart,
  GiftedTimeSeriesChart,
  GiftedHeatMapComponent
};
