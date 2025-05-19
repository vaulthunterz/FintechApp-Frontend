import React from 'react';
import { Platform } from 'react-native';
import { WebDonutChart } from './WebCharts';
import { GiftedDonutChart } from './GiftedCharts';
import { PieChartProps } from './ChartTypes';

const PieChart: React.FC<PieChartProps> = ({
  data,
  colors = [],
  title = '',
  width,
  height,
  innerRadius = 0,
  labelRadius = 1,
  padAngle = 0,
  ...rest
}) => {
  // Convert PieChart props to DonutChart compatible format
  const donutProps = {
    data,
    colors,
    title,
    width,
    height,
    innerRadius,
    ...rest
  };

  return Platform.OS === 'web' ? (
    <WebDonutChart {...donutProps} />
  ) : (
    <GiftedDonutChart {...donutProps} />
  );
};

export default PieChart;
