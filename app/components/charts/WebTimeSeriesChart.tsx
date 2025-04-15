import React from 'react';
import { Dimensions } from 'react-native';
import GiftedTimeSeriesChart from './GiftedTimeSeriesChart';

interface TimeSeriesChartProps {
  data: Array<{ x: string | Date; y: number }[]>;
  title: string;
  width?: number;
  height?: number;
  yAxisLabel?: string;
  xAxisLabel?: string;
  legendItems?: Array<{ name: string; color: string }>;
}

const WebTimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  title,
  width = Dimensions.get('window').width - 40,
  height = 300,
  yAxisLabel = '',
  xAxisLabel = '',
  legendItems = []
}) => {

  return (
    <GiftedTimeSeriesChart
      data={data}
      title={title}
      width={width}
      height={height}
      yAxisLabel={yAxisLabel}
      xAxisLabel={xAxisLabel}
      legendItems={legendItems}
    />
  );
};



export default WebTimeSeriesChart;
