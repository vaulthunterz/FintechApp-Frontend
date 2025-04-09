import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryLine, VictoryChart, VictoryTheme, VictoryAxis, VictoryLabel, VictoryScatter, VictoryLegend } from 'victory-native';

interface TimeSeriesChartProps {
  data: Array<{ x: string | Date; y: number }[]>;
  title: string;
  width?: number;
  height?: number;
  yAxisLabel?: string;
  xAxisLabel?: string;
  colors?: string[];
  legendItems?: Array<{ name: string; color: string }>;
  showPoints?: boolean;
}

const TimeSeriesChartComponent: React.FC<TimeSeriesChartProps> = ({
  data,
  title,
  width = Dimensions.get('window').width - 40,
  height = 300,
  yAxisLabel = '',
  xAxisLabel = '',
  colors = ['#1976d2', '#f44336', '#4caf50'],
  legendItems = [],
  showPoints = true
}) => {
  return (
    <View style={[styles.container, { width }]}>
      <Text style={styles.title}>{title}</Text>
      <VictoryChart
        width={width}
        height={height}
        theme={VictoryTheme.material}
        padding={{ top: 40, bottom: 50, left: 60, right: 20 }}
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
          <React.Fragment key={index}>
            <VictoryLine
              data={dataset}
              style={{
                data: {
                  stroke: colors[index % colors.length],
                  strokeWidth: 2
                }
              }}
              animate={{
                duration: 500,
                onLoad: { duration: 300 }
              }}
            />
            {showPoints && (
              <VictoryScatter
                data={dataset}
                size={4}
                style={{
                  data: {
                    fill: colors[index % colors.length]
                  }
                }}
              />
            )}
          </React.Fragment>
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

export default TimeSeriesChartComponent;
