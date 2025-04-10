import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../contexts/ThemeContext';

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
  yAxisLabel = '', // Used in LineChart component
  xAxisLabel = '',
  legendItems = []
}) => {
  const { colors: themeColors } = useTheme();

  // Helper function to convert hex to rgb
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };
  // Format data for LineChart component
  const formattedData = {
    labels: data[0].map(item => typeof item.x === 'string' ? item.x : item.x.toISOString().split('T')[0]),
    datasets: data.map((dataset, index) => {
      const color = legendItems[index]?.color || themeColors.primary;
      const rgb = hexToRgb(color);
      return {
        data: dataset.map(item => item.y),
        color: (opacity = 1) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`,
        strokeWidth: 2
      };
    })
  };

  // Chart configuration
  const chartConfig = {
    backgroundColor: themeColors.card,
    backgroundGradientFrom: themeColors.card,
    backgroundGradientTo: themeColors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => {
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
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: themeColors.primary,
    },
  };

  // Create dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: themeColors.card,
    },
    title: {
      color: themeColors.text,
    },
    legendText: {
      color: themeColors.textSecondary,
    },
    axisLabel: {
      color: themeColors.textSecondary,
    }
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Text style={[styles.title, dynamicStyles.title]}>{title}</Text>

      {/* Legend */}
      {legendItems.length > 0 && (
        <View style={styles.legendContainer}>
          {legendItems.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, dynamicStyles.legendText]}>{item.name}</Text>
            </View>
          ))}
        </View>
      )}

      <LineChart
        data={formattedData}
        width={width}
        height={height}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        yAxisLabel={yAxisLabel || "$"}
        yAxisSuffix=""
        fromZero
      />

      {/* Axis Labels */}
      {xAxisLabel && (
        <Text style={[styles.axisLabel, dynamicStyles.axisLabel]}>{xAxisLabel}</Text>
      )}
    </View>
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
  chart: {
    marginVertical: 8,
    borderRadius: 10,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
  },
  axisLabel: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 5,
  }
});

export default WebTimeSeriesChart;
