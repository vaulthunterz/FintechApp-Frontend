import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import GiftedAreaChart from './GiftedAreaChart';

interface AreaChartProps {
  data: Array<{ x: string | Date; y: number }[]>;
  title: string;
  width?: number;
  height?: number;
  yAxisLabel?: string;
  xAxisLabel?: string;
  colors?: string[];
  legendItems?: Array<{ name: string; color: string }>;
}

const AreaChartComponent: React.FC<AreaChartProps> = ({
  data,
  title,
  width = Dimensions.get('window').width - 40,
  height = 300,
  yAxisLabel = '',
  xAxisLabel = '',
  colors = ['rgba(25, 118, 210, 0.5)', 'rgba(244, 67, 54, 0.5)', 'rgba(76, 175, 80, 0.5)'],
  legendItems = []
}) => {
  return (
    <GiftedAreaChart
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

export default AreaChartComponent;
