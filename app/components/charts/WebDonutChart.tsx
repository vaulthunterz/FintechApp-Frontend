import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

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
  // Format data for PieChart component
  const pieData = data.map((item, index) => ({
    name: item.x,
    population: item.y, // Using 'population' as the value key for PieChart
    color: colors[index % colors.length],
    legendFontColor: '#7F7F7F',
    legendFontSize: 12
  }));

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
  };

  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + item.y, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <PieChart
          data={pieData}
          width={width}
          height={height}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[width / 4, 0]} // Center the chart
          hasLegend={true}
          avoidFalseZero
        />
        
        {/* Center text to make it look like a donut */}
        <View style={[styles.centerText, { left: width / 2 - 40, top: height / 2 - 30 }]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toFixed(0)}</Text>
        </View>
      </View>
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
  chartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    backgroundColor: 'white',
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
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  }
});

export default WebDonutChart;
