import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import GiftedDonutChart from './GiftedDonutChart';
import { useTheme } from '../../contexts/ThemeContext';

interface DonutChartProps {
  data: Array<{ x: string; y: number }>;
  title: string;
  width?: number;
  height?: number;
  colors?: string[];
}

const WebDonutChart: React.FC<DonutChartProps> = ({
  data,
  title,
  width = Dimensions.get('window').width - 40,
  height = 300,
  colors = ['#1976d2', '#f44336', '#4caf50', '#ff9800', '#9c27b0', '#795548']
}) => {
  const { colors: themeColors, isDark } = useTheme();
  // Format data for PieChart component
  const pieData = data.map((item, index) => ({
    name: item.x,
    population: item.y, // Using 'population' as the value key for PieChart
    color: colors[index % colors.length],
    legendFontColor: themeColors.textSecondary,
    legendFontSize: 12
  }));

  // Chart configuration
  const chartConfig = {
    backgroundColor: themeColors.card,
    backgroundGradientFrom: themeColors.card,
    backgroundGradientTo: themeColors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => {
      // Convert hex to rgba
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
      };

      const rgb = hexToRgb(themeColors.text);
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    },
    labelColor: (opacity = 1) => {
      const rgb = hexToRgb(themeColors.text);
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    },
    style: {
      borderRadius: 16,
    },
  };

  // Helper function to convert hex to rgb
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + item.y, 0);

  // Create dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: themeColors.card,
    },
    title: {
      color: themeColors.text,
    },
    centerText: {
      backgroundColor: themeColors.card,
    },
    totalLabel: {
      color: themeColors.textSecondary,
    },
    totalValue: {
      color: themeColors.text,
    }
  };

  return (
    <GiftedDonutChart
      data={data}
      title={title}
      width={width}
      height={height}
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
  },
  chartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    borderRadius: 40,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  totalLabel: {
    fontSize: 12,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
  }
});

export default WebDonutChart;
