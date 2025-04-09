import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

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
  // Format data for LineChart component
  const formattedData = {
    labels: data[0].map(item => typeof item.x === 'string' ? item.x : item.x.toISOString().split('T')[0]),
    datasets: data.map((dataset, index) => ({
      data: dataset.map(item => item.y),
      color: (opacity = 1) => legendItems[index]?.color || `rgba(30, 136, 229, ${opacity})`,
      strokeWidth: 2
    }))
  };

  // Chart configuration
  const chartConfig = {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: '#1e88e5',
    },
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      {/* Legend */}
      {legendItems.length > 0 && (
        <View style={styles.legendContainer}>
          {legendItems.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.name}</Text>
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
        yAxisLabel="$"
        yAxisSuffix=""
        fromZero
      />
      
      {/* Axis Labels */}
      {xAxisLabel && (
        <Text style={styles.axisLabel}>{xAxisLabel}</Text>
      )}
    </View>
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
    color: '#666',
  },
  axisLabel: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  }
});

export default WebTimeSeriesChart;
