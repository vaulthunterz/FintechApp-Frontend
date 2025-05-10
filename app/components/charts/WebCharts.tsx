/**
 * Consolidated Web Charts implementations using Victory
 */
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import {
  BarChartProps,
  DonutChartProps,
  TimeSeriesChartProps,
  AreaChartProps,
  ExpenseChartProps,
  DEFAULT_CHART_WIDTH,
  DEFAULT_CHART_HEIGHT,
  DEFAULT_COLORS
} from './ChartTypes';

// Import Victory components only for web platform
let VictoryComponents: any = {
  VictoryPie: () => null,
  VictoryBar: () => null,
  VictoryChart: () => null,
  VictoryAxis: () => null,
  VictoryLabel: () => null,
  VictoryLegend: () => null,
  VictoryLine: () => null,
  VictoryArea: () => null,
  VictoryScatter: () => null,
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
      VictoryLine: Victory.VictoryLine,
      VictoryArea: Victory.VictoryArea,
      VictoryScatter: Victory.VictoryScatter,
      VictoryTheme: Victory.VictoryTheme
    };
  } catch (error) {
    console.error('Failed to import Victory for web:', error);
  }
}

const {
  VictoryPie,
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryLabel,
  VictoryLegend,
  VictoryLine,
  VictoryArea,
  VictoryScatter,
  VictoryTheme
} = VictoryComponents;

// Placeholder component for non-web platforms
const WebUnsupportedPlaceholder: React.FC<{ title: string }> = ({ title }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={{ color: colors.text, textAlign: 'center', marginTop: 20 }}>
        Web charts are only available on web platform
      </Text>
    </View>
  );
};

// ==================== Web Bar Chart ====================
export const WebBarChart: React.FC<BarChartProps> = (props) => {
  const { data, title, width = DEFAULT_CHART_WIDTH, height = DEFAULT_CHART_HEIGHT, yAxisLabel, colors = DEFAULT_COLORS } = props;
  const { colors: themeColors, isDark } = useTheme();
  
  if (Platform.OS !== 'web') {
    return <WebUnsupportedPlaceholder title={title} />;
  }
  
  const chartData = data.map((item, index) => ({
    x: item.x,
    y: item.y,
    fill: colors[index % colors.length]
  }));
  
  return (
    <View style={[styles.container, { backgroundColor: themeColors.card, width }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
      
      <View style={styles.chartContainer}>
        <VictoryChart
          theme={VictoryTheme.material}
          width={width - 40}
          height={height - 80}
          domainPadding={{ x: 20 }}
          padding={{ top: 20, bottom: 50, left: 60, right: 20 }}
          style={{
            background: { fill: themeColors.card },
          }}
        >
          <VictoryAxis
            tickFormat={(t) => `${t}`}
            style={{
              axis: { stroke: themeColors.border },
              ticks: { stroke: themeColors.border },
              tickLabels: { fill: themeColors.textSecondary, fontSize: 10, angle: -45 }
            }}
          />
          <VictoryAxis
            dependentAxis
            tickFormat={(t) => `${yAxisLabel ? yAxisLabel : ''}${t}`}
            style={{
              axis: { stroke: themeColors.border },
              ticks: { stroke: themeColors.border },
              tickLabels: { fill: themeColors.textSecondary, fontSize: 10 }
            }}
          />
          <VictoryBar
            data={chartData}
            style={{
              data: {
                fill: ({ datum }) => datum.fill,
              },
              labels: {
                fill: themeColors.text
              }
            }}
            labels={({ datum }) => `${datum.y}`}
          />
        </VictoryChart>
      </View>
    </View>
  );
};

// ==================== Web Donut Chart ====================
export const WebDonutChart: React.FC<DonutChartProps> = (props) => {
  const { data, title, width = DEFAULT_CHART_WIDTH, height = DEFAULT_CHART_HEIGHT, colors = DEFAULT_COLORS } = props;
  const { colors: themeColors, isDark } = useTheme();
  
  if (Platform.OS !== 'web') {
    return <WebUnsupportedPlaceholder title={title} />;
  }
  
  const chartData = data.map((item, index) => ({
    x: item.x,
    y: item.y,
    fill: colors[index % colors.length]
  }));
  
  // Calculate total
  const total = data.reduce((sum, item) => sum + item.y, 0);
  
  return (
    <View style={[styles.container, { backgroundColor: themeColors.card, width }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
      
      <View style={styles.chartContainer}>
        <VictoryPie
          data={chartData}
          width={width - 40}
          height={height - 80}
          innerRadius={70}
          labelRadius={90}
          style={{
            labels: {
              fill: themeColors.text,
              fontSize: 12
            },
            data: {
              fill: ({ datum }) => datum.fill
            }
          }}
          labels={({ datum }) => `${datum.x}: ${Math.round((datum.y / total) * 100)}%`}
        />
      </View>
      
      <View style={styles.legend}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors[index % colors.length] }]} />
            <Text style={[styles.legendText, { color: themeColors.text }]}>
              {item.x}: {item.y.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ==================== Web Time Series Chart ====================
export const WebTimeSeriesChart: React.FC<TimeSeriesChartProps> = (props) => {
  const {
    data,
    title,
    width = DEFAULT_CHART_WIDTH,
    height = DEFAULT_CHART_HEIGHT,
    yAxisLabel,
    xAxisLabel,
    colors = DEFAULT_COLORS,
    legendItems = []
  } = props;
  const { colors: themeColors, isDark } = useTheme();
  
  if (Platform.OS !== 'web') {
    return <WebUnsupportedPlaceholder title={title} />;
  }
  
  // Use provided legend items or generate from data
  const chartLegendItems = legendItems.length > 0
    ? legendItems
    : data.map((_, index) => ({
        name: `Series ${index + 1}`,
        color: colors[index % colors.length]
      }));
  
  return (
    <View style={[styles.container, { backgroundColor: themeColors.card, width }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
      
      <View style={styles.legend}>
        {chartLegendItems.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color || colors[index % colors.length] }]} />
            <Text style={[styles.legendText, { color: themeColors.text }]}>{item.name}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.chartContainer}>
        <VictoryChart
          theme={VictoryTheme.material}
          width={width - 40}
          height={height - 80}
          padding={{ top: 20, bottom: 50, left: 60, right: 20 }}
          style={{
            background: { fill: themeColors.card },
          }}
        >
          <VictoryAxis
            tickFormat={(t) => typeof t === 'string' ? t : new Date(t).toLocaleDateString()}
            style={{
              axis: { stroke: themeColors.border },
              ticks: { stroke: themeColors.border },
              tickLabels: { fill: themeColors.textSecondary, fontSize: 10, angle: -45 }
            }}
          />
          <VictoryAxis
            dependentAxis
            tickFormat={(t) => `${yAxisLabel ? yAxisLabel : ''}${t}`}
            style={{
              axis: { stroke: themeColors.border },
              ticks: { stroke: themeColors.border },
              tickLabels: { fill: themeColors.textSecondary, fontSize: 10 }
            }}
          />
          {data.map((series, index) => (
            <VictoryLine
              key={`line-${index}`}
              data={series.map(point => ({
                x: typeof point.x === 'string' ? point.x : new Date(point.x),
                y: point.y
              }))}
              style={{
                data: { stroke: colors[index % colors.length] }
              }}
            />
          ))}
        </VictoryChart>
      </View>
      
      {xAxisLabel && (
        <Text style={[styles.axisLabel, { color: themeColors.textSecondary }]}>
          {xAxisLabel}
        </Text>
      )}
    </View>
  );
};

// ==================== Web Area Chart ====================
export const WebAreaChart: React.FC<AreaChartProps> = (props) => {
  const {
    data,
    title,
    width = DEFAULT_CHART_WIDTH,
    height = DEFAULT_CHART_HEIGHT,
    yAxisLabel,
    xAxisLabel,
    colors = DEFAULT_COLORS,
    legendItems = []
  } = props;
  const { colors: themeColors, isDark } = useTheme();
  
  if (Platform.OS !== 'web') {
    return <WebUnsupportedPlaceholder title={title} />;
  }
  
  // Use provided legend items or generate from data
  const chartLegendItems = legendItems.length > 0
    ? legendItems
    : data.map((_, index) => ({
        name: `Series ${index + 1}`,
        color: colors[index % colors.length]
      }));
  
  return (
    <View style={[styles.container, { backgroundColor: themeColors.card, width }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
      
      <View style={styles.legend}>
        {chartLegendItems.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color || colors[index % colors.length] }]} />
            <Text style={[styles.legendText, { color: themeColors.text }]}>{item.name}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.chartContainer}>
        <VictoryChart
          theme={VictoryTheme.material}
          width={width - 40}
          height={height - 80}
          padding={{ top: 20, bottom: 50, left: 60, right: 20 }}
          style={{
            background: { fill: themeColors.card },
          }}
        >
          <VictoryAxis
            tickFormat={(t) => typeof t === 'string' ? t : new Date(t).toLocaleDateString()}
            style={{
              axis: { stroke: themeColors.border },
              ticks: { stroke: themeColors.border },
              tickLabels: { fill: themeColors.textSecondary, fontSize: 10, angle: -45 }
            }}
          />
          <VictoryAxis
            dependentAxis
            tickFormat={(t) => `${yAxisLabel ? yAxisLabel : ''}${t}`}
            style={{
              axis: { stroke: themeColors.border },
              ticks: { stroke: themeColors.border },
              tickLabels: { fill: themeColors.textSecondary, fontSize: 10 }
            }}
          />
          {data.map((series, index) => (
            <VictoryArea
              key={`area-${index}`}
              data={series.map(point => ({
                x: typeof point.x === 'string' ? point.x : new Date(point.x),
                y: point.y
              }))}
              style={{
                data: { 
                  fill: `${colors[index % colors.length]}80`, // Add transparency
                  stroke: colors[index % colors.length]
                }
              }}
            />
          ))}
        </VictoryChart>
      </View>
      
      {xAxisLabel && (
        <Text style={[styles.axisLabel, { color: themeColors.textSecondary }]}>
          {xAxisLabel}
        </Text>
      )}
    </View>
  );
};

// ==================== Web Expense Chart ====================
export const WebExpenseChart: React.FC<ExpenseChartProps> = ({ data, title, type, period }) => {
  const { colors } = useTheme();
  
  if (Platform.OS !== 'web') {
    return <WebUnsupportedPlaceholder title={title} />;
  }
  
  // Format data for Victory charts
  const chartData = data.map((item) => ({
    x: item.category,
    y: item.amount,
    color: item.color,
    label: `${item.category}: ${item.amount.toLocaleString()}`
  }));
  
  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {period && (
        <Text style={[styles.period, { color: colors.textSecondary }]}>{period}</Text>
      )}
      
      <View style={styles.chartContainer}>
        {type === 'pie' ? (
          <VictoryPie
            data={chartData}
            width={DEFAULT_CHART_WIDTH - 40}
            height={DEFAULT_CHART_HEIGHT - 80}
            colorScale={data.map(item => item.color)}
            innerRadius={70}
            labelRadius={90}
            style={{
              labels: {
                fill: colors.text,
                fontSize: 12
              }
            }}
            labels={({ datum }) => `${datum.x}: ${Math.round((datum.y / data.reduce((sum, d) => sum + d.amount, 0)) * 100)}%`}
          />
        ) : (
          <VictoryChart
            theme={VictoryTheme.material}
            width={DEFAULT_CHART_WIDTH - 40}
            height={DEFAULT_CHART_HEIGHT - 80}
            domainPadding={{ x: 20 }}
            padding={{ top: 20, bottom: 50, left: 60, right: 20 }}
            style={{
              background: { fill: colors.card },
            }}
          >
            <VictoryAxis
              style={{
                axis: { stroke: colors.border },
                ticks: { stroke: colors.border },
                tickLabels: { fill: colors.textSecondary, fontSize: 10, angle: -45 }
              }}
            />
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: colors.border },
                ticks: { stroke: colors.border },
                tickLabels: { fill: colors.textSecondary, fontSize: 10 }
              }}
            />
            <VictoryBar
              data={chartData}
              style={{
                data: {
                  fill: ({ datum }) => datum.color,
                },
                labels: {
                  fill: colors.text
                }
              }}
              labels={({ datum }) => `${datum.y}`}
            />
          </VictoryChart>
        )}
      </View>
      
      <View style={styles.legend}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>
              {item.category}: {item.amount.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Shared styles
const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  period: {
    fontSize: 14,
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  axisLabel: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
  },
  legend: {
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
  },
});
