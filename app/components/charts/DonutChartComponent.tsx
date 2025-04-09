import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryPie, VictoryLegend, VictoryLabel } from 'victory-native';

interface DonutChartProps {
  data: Array<{ x: string; y: number }>;
  title: string;
  width?: number;
  height?: number;
  colors?: string[];
  innerRadius?: number;
  labelRadius?: number;
  showLabels?: boolean;
  showLegend?: boolean;
}

const DonutChartComponent: React.FC<DonutChartProps> = ({
  data,
  title,
  width = Dimensions.get('window').width - 40,
  height = 300,
  colors = ['#1976d2', '#f44336', '#4caf50', '#ff9800', '#9c27b0', '#795548'],
  innerRadius = 70,
  labelRadius = 90,
  showLabels = true,
  showLegend = true
}) => {
  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + item.y, 0);
  
  // Format data for display
  const formattedData = data.map(item => ({
    ...item,
    y: item.y,
    label: showLabels ? `${item.x}: ${((item.y / total) * 100).toFixed(1)}%` : ''
  }));

  // Create legend items
  const legendItems = data.map((item, index) => ({
    name: `${item.x}: $${item.y.toFixed(0)}`,
    symbol: { fill: colors[index % colors.length] }
  }));

  return (
    <View style={[styles.container, { width }]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <VictoryPie
          data={formattedData}
          width={width}
          height={height}
          innerRadius={innerRadius}
          labelRadius={labelRadius}
          style={{
            data: {
              fill: ({ datum, index }) => colors[index % colors.length]
            },
            labels: {
              fontSize: 10,
              fill: '#333'
            }
          }}
          animate={{
            duration: 500,
            onLoad: { duration: 300 }
          }}
          labelComponent={<VictoryLabel style={{ fontSize: 10 }} />}
        />
        {showLegend && (
          <VictoryLegend
            x={width / 2 - 125}
            y={height - 50}
            orientation="horizontal"
            gutter={20}
            style={{ 
              labels: { fontSize: 10 }
            }}
            data={legendItems}
            centerTitle
            colorScale={colors}
          />
        )}
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
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default DonutChartComponent;
