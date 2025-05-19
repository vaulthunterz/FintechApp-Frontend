import React from 'react';
import { Platform } from 'react-native';
import { WebBarChart } from './WebCharts';
import { GiftedBarChart } from './GiftedCharts';
import { BarChartProps } from './ChartTypes';

const BarChart: React.FC<BarChartProps> = (props) => {
  return Platform.OS === 'web' ? (
    <WebBarChart {...props} />
  ) : (
    <GiftedBarChart {...props} />
  );
};

export default BarChart;
