import React from 'react';
import { Platform } from 'react-native';
import { WebTimeSeriesChart } from './WebCharts';
import { GiftedTimeSeriesChart } from './GiftedCharts';
import { TimeSeriesChartProps } from './ChartTypes';

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = (props) => {
  return Platform.OS === 'web' ? (
    <WebTimeSeriesChart {...props} />
  ) : (
    <GiftedTimeSeriesChart {...props} />
  );
};

export default TimeSeriesChart;
