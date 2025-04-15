import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import GiftedBarChart from './GiftedBarChart';
import { useTheme } from '../../contexts/ThemeContext';

interface BarChartProps {
  data: Array<{ x: string; y: number }>;
  title: string;
  width?: number;
  height?: number;
  yAxisLabel?: string;
  xAxisLabel?: string;
  colors?: string[];
}

const BarChartComponent: React.FC<BarChartProps> = ({
  data,
  title,
  width = Dimensions.get('window').width - 40,
  height = 300,
  yAxisLabel = '',
  xAxisLabel = '',
  colors = ['#1976d2']
}) => {
  const { colors: themeColors } = useTheme();

  // Create dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: themeColors.card,
    },
    title: {
      color: themeColors.text,
    }
  };

  return (
    <GiftedBarChart
      data={data}
      title={title}
      width={width}
      height={height}
      yAxisLabel={yAxisLabel}
      xAxisLabel={xAxisLabel}
      colors={colors}
    />
  );
};

const styles = StyleSheet.create({
  container: {
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

export default BarChartComponent;
