import BarChartComponent from './BarChartComponent';
import AreaChartComponent from './AreaChartComponent';
import DonutChartComponent from './DonutChartComponent';
import TimeSeriesChartComponent from './TimeSeriesChartComponent';
import HeatMapComponent from './HeatMapComponent';
import ChartSelector from './ChartSelector';
import type { ChartType } from './ChartSelector';

// Named exports
export {
  BarChartComponent,
  AreaChartComponent,
  DonutChartComponent,
  TimeSeriesChartComponent,
  HeatMapComponent,
  ChartSelector
};
export type { ChartType };

// Default export (required by Expo Router)
export default {
  BarChartComponent,
  AreaChartComponent,
  DonutChartComponent,
  TimeSeriesChartComponent,
  HeatMapComponent,
  ChartSelector
};
