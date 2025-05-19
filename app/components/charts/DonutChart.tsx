import React from 'react';
import { Platform } from 'react-native';
import { WebDonutChart } from './WebCharts';
import { GiftedDonutChart } from './GiftedCharts';
import { DonutChartProps } from './ChartTypes';

const DonutChart: React.FC<DonutChartProps> = (props) => {
  return Platform.OS === 'web' ? (
    <WebDonutChart {...props} />
  ) : (
    <GiftedDonutChart {...props} />
  );
};

export default DonutChart;
