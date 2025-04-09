import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryBar, VictoryChart, VictoryTheme, VictoryAxis, VictoryLabel } from 'victory-native';

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
  return (
    <View style={[styles.container, { width }]}>
      <Text style={styles.title}>{title}</Text>
      <VictoryChart
        width={width}
        height={height}
        theme={VictoryTheme.material}
        domainPadding={{ x: 20 }}
        padding={{ top: 20, bottom: 50, left: 60, right: 20 }}
      >
        <VictoryAxis
          tickLabelComponent={<VictoryLabel angle={-45} textAnchor="end" />}
          style={{
            tickLabels: { fontSize: 10, padding: 5 }
          }}
          label={xAxisLabel}
          axisLabelComponent={<VictoryLabel dy={25} />}
        />
        <VictoryAxis
          dependentAxis
          label={yAxisLabel}
          axisLabelComponent={<VictoryLabel dy={-40} />}
          tickFormat={(t) => `$${t}`}
          style={{
            tickLabels: { fontSize: 10, padding: 5 }
          }}
        />
        <VictoryBar
          data={data}
          style={{
            data: {
              fill: ({ datum, index }) => colors[index % colors.length] || colors[0],
              width: 20
            }
          }}
          animate={{
            duration: 500,
            onLoad: { duration: 300 }
          }}
          labels={({ datum }) => `$${datum.y.toFixed(0)}`}
          labelComponent={<VictoryLabel dy={-10} />}
        />
      </VictoryChart>
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
  }
});

export default BarChartComponent;
