import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import GiftedTimeSeriesChart from './GiftedTimeSeriesChart';

interface TimeSeriesChartProps {
  data: Array<{ x: string | Date; y: number }[]>;
  title: string;
  width?: number;
  height?: number;
  yAxisLabel?: string;
  xAxisLabel?: string;
  colors?: string[];
  legendItems?: Array<{ name: string; color: string }>;
  showPoints?: boolean;
}

const TimeSeriesChartComponent: React.FC<TimeSeriesChartProps> = ({
  data,
  title,
  width = Dimensions.get('window').width - 40,
  height = 300,
  yAxisLabel = '',
  xAxisLabel = '',
  colors = ['#1976d2', '#f44336', '#4caf50'],
  legendItems = [],
  showPoints = true
}) => {
  return (
    <GiftedTimeSeriesChart
      data={data}
      title={title}
      width={width}
      height={height}
      yAxisLabel={yAxisLabel}
      xAxisLabel={xAxisLabel}
      colors={colors}
      legendItems={legendItems}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  }
});

export default TimeSeriesChartComponent;
