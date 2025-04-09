import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart as RNBarChart } from 'react-native-chart-kit';

interface BarChartProps {
  data: {
    labels: string[];
    datasets: {
      data: number[];
      colors?: string[];
    }[];
  };
  title?: string;
  height?: number;
  width?: number;
  yAxisSuffix?: string;
  yAxisLabel?: string;
  chartConfig?: any;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  height = 220,
  width = Dimensions.get('window').width - 40,
  yAxisSuffix = '',
  yAxisLabel = '',
  chartConfig
}) => {
  const defaultChartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(30, 136, 229, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    barPercentage: 0.7,
  };

  const config = chartConfig || defaultChartConfig;

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <RNBarChart
        data={data}
        width={width}
        height={height}
        yAxisSuffix={yAxisSuffix}
        yAxisLabel={yAxisLabel}
        chartConfig={config}
        style={styles.chart}
        fromZero
        showValuesOnTopOfBars
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
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
});

export default BarChart;
