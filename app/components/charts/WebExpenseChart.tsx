import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

// Import Victory components only for web platform
let VictoryComponents: any = {
  VictoryPie: () => null,
  VictoryBar: () => null,
  VictoryChart: () => null,
  VictoryAxis: () => null,
  VictoryLabel: () => null,
  VictoryLegend: () => null,
  VictoryTheme: { material: {} }
};

// Only import Victory on web platform
if (Platform.OS === 'web') {
  try {
    // Dynamic import for Victory (web version)
    const Victory = require('victory');
    VictoryComponents = {
      VictoryPie: Victory.VictoryPie,
      VictoryBar: Victory.VictoryBar,
      VictoryChart: Victory.VictoryChart,
      VictoryAxis: Victory.VictoryAxis,
      VictoryLabel: Victory.VictoryLabel,
      VictoryLegend: Victory.VictoryLegend,
      VictoryTheme: Victory.VictoryTheme
    };
  } catch (error) {
    console.error('Failed to import Victory for web:', error);
  }
}

const { VictoryPie, VictoryBar, VictoryChart, VictoryAxis, VictoryLabel, VictoryTheme } = VictoryComponents;

interface ExpenseData {
  category: string;
  amount: number;
  color: string;
}

interface WebExpenseChartProps {
  data: ExpenseData[];
  title: string;
  type: 'pie' | 'bar';
  period?: string;
}

const WebExpenseChart: React.FC<WebExpenseChartProps> = ({ data, title, type, period }) => {
  const { colors, isDark } = useTheme();

  // If not on web platform, return a placeholder
  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={{ color: colors.text }}>Charts are only available on web platform</Text>
      </View>
    );
  }

  // Format data for Victory charts
  const chartData = data.map((item) => ({
    x: item.category,
    y: item.amount,
    color: item.color,
    label: `${item.category}: ${item.amount.toLocaleString()} KES`
  }));

  // Calculate total amount
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

  const renderChart = () => {
    switch (type) {
      case 'pie':
        return (
          <VictoryPie
            data={chartData}
            width={600}
            height={300}
            colorScale={data.map(item => item.color)}
            style={{
              labels: {
                fill: colors.text,
                fontSize: 12
              }
            }}
            labelRadius={({ innerRadius }) => (innerRadius || 0) + 30}
            innerRadius={30}
            padAngle={2}
          />
        );
      case 'bar':
        return (
          <VictoryChart
            theme={VictoryTheme.material}
            domainPadding={20}
            width={600}
            height={300}
          >
            <VictoryAxis
              style={{
                axis: { stroke: colors.textSecondary },
                tickLabels: {
                  fill: colors.textSecondary,
                  fontSize: 8,
                  angle: -45,
                  textAnchor: 'end'
                }
              }}
            />
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: colors.textSecondary },
                tickLabels: { fill: colors.textSecondary }
              }}
              tickFormat={(t) => `${t / 1000}K`}
            />
            <VictoryBar
              data={chartData}
              style={{
                data: {
                  fill: ({ datum }) => datum.color
                }
              }}
              barWidth={25}
              labels={({ datum }) => `${datum.y.toLocaleString()}`}
              labelComponent={
                <VictoryLabel
                  style={{ fill: colors.text, fontSize: 8 }}
                  dy={-10}
                />
              }
            />
          </VictoryChart>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {period && (
        <Text style={[styles.period, { color: colors.textSecondary }]}>{period}</Text>
      )}

      <View style={styles.chartContainer}>
        {renderChart()}
      </View>

      <View style={styles.totalContainer}>
        <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total:</Text>
        <Text style={[styles.totalAmount, { color: colors.text }]}>
          {totalAmount.toLocaleString()} KES
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  period: {
    fontSize: 14,
    marginBottom: 15,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    marginRight: 5,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WebExpenseChart;
