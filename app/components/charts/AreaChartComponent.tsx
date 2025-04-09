import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryArea, VictoryChart, VictoryTheme, VictoryAxis, VictoryLabel, VictoryLegend } from 'victory-native';

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
    <View style={[styles.container, { width }]}>
      <Text style={styles.title}>{title}</Text>
      <VictoryChart
        width={width}
        height={height}
        theme={VictoryTheme.material}
        padding={{ top: 20, bottom: 50, left: 60, right: 20 }}
      >
        {legendItems.length > 0 && (
          <VictoryLegend
            x={width / 2 - (legendItems.length * 40)}
            y={10}
            orientation="horizontal"
            gutter={20}
            style={{ 
              labels: { fontSize: 10 }
            }}
            data={legendItems.map(item => ({
              name: item.name,
              symbol: { fill: item.color }
            }))}
          />
        )}
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
        {data.map((dataset, index) => (
          <VictoryArea
            key={index}
            data={dataset}
            style={{
              data: {
                fill: colors[index % colors.length],
                stroke: colors[index % colors.length].replace('0.5', '1'),
                strokeWidth: 2
              }
            }}
            animate={{
              duration: 500,
              onLoad: { duration: 300 }
            }}
          />
        ))}
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

export default AreaChartComponent;
