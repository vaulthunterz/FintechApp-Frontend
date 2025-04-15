import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryBar, VictoryChart, VictoryTheme, VictoryAxis, VictoryLabel } from '../../utils/victoryUtils';

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
  theme?: 'light' | 'dark';
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  height = 220,
  width = Dimensions.get('window').width - 40,
  yAxisSuffix = '',
  yAxisLabel = '',
  theme = 'light'
}) => {
  // Format data for Victory
  const formattedData = data.labels.map((label, index) => ({
    x: label,
    y: data.datasets[0].data[index],
    color: data.datasets[0].colors ? data.datasets[0].colors[index] : undefined
  }));

  // Theme colors
  const themeColors = {
    light: {
      axis: '#000000',
      axisLabel: '#666666',
      barDefault: '#1E88E5',
      background: '#FFFFFF',
      text: '#000000'
    },
    dark: {
      axis: '#FFFFFF',
      axisLabel: '#AAAAAA',
      barDefault: '#4FC3F7',
      background: '#333333',
      text: '#FFFFFF'
    }
  };

  const colors = themeColors[theme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
      <VictoryChart
        theme={VictoryTheme.material}
        domainPadding={20}
        width={width}
        height={height}
      >
        <VictoryAxis
          style={{
            axis: { stroke: colors.axis },
            tickLabels: { fill: colors.axisLabel, fontSize: 10 }
          }}
        />
        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: colors.axis },
            tickLabels: { fill: colors.axisLabel }
          }}
          tickFormat={(t) => `${t}${yAxisSuffix}`}
        />
        <VictoryBar
          data={formattedData}
          style={{
            data: {
              fill: ({ datum }) => datum.color || colors.barDefault
            }
          }}
          barWidth={30}
          labels={({ datum }) => `${datum.y}${yAxisSuffix}`}
          labelComponent={
            <VictoryLabel
              style={{ fill: colors.text, fontSize: 10 }}
              dy={-10}
            />
          }
        />
      </VictoryChart>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default BarChart;
