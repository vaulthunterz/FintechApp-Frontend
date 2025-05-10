/**
 * Consolidated Gifted Charts implementations
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
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

// ==================== Bar Chart ====================
export const GiftedBarChart: React.FC<BarChartProps> = ({
  data,
  title,
  width = DEFAULT_CHART_WIDTH,
  height = DEFAULT_CHART_HEIGHT,
  yAxisLabel = '',
  xAxisLabel = '',
  colors = DEFAULT_COLORS
}) => {
  const { colors: themeColors } = useTheme();
  
  // Format data for BarChart
  const barData = data.map((item, index) => ({
    value: item.y,
    label: item.x,
    frontColor: colors[index % colors.length],
    topLabelComponent: () => (
      <Text style={{ color: themeColors.text, fontSize: 10, marginBottom: 4 }}>
        {item.y.toLocaleString()}
      </Text>
    ),
  }));

  return (
    <View style={[styles.container, { backgroundColor: themeColors.card, width }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
      
      <View style={styles.chartContainer}>
        <BarChart
          data={barData}
          width={width - 40}
          height={height - 80}
          barWidth={width / (data.length * 3)}
          spacing={width / (data.length * 6)}
          barBorderRadius={4}
          xAxisThickness={1}
          yAxisThickness={1}
          xAxisColor={themeColors.border}
          yAxisColor={themeColors.border}
          yAxisTextStyle={{ color: themeColors.textSecondary }}
          xAxisLabelTextStyle={{ color: themeColors.textSecondary, fontSize: 10 }}
          noOfSections={5}
          maxValue={Math.max(...data.map(item => item.y)) * 1.2}
          yAxisLabelPrefix={yAxisLabel ? `${yAxisLabel} ` : ''}
          yAxisLabelSuffix=""
          hideYAxisText={false}
          showFractionalValues={false}
          showXAxisLabels={true}
          showYAxisLabels={true}
          hideRules={false}
          rulesColor={themeColors.border + '40'}
          rulesType="solid"
        />
      </View>
      
      {xAxisLabel && (
        <Text style={[styles.axisLabel, { color: themeColors.textSecondary }]}>
          {xAxisLabel}
        </Text>
      )}
    </View>
  );
};

// ==================== Donut Chart ====================
export const GiftedDonutChart: React.FC<DonutChartProps> = ({
  data,
  title,
  width = DEFAULT_CHART_WIDTH,
  height = DEFAULT_CHART_HEIGHT,
  colors = DEFAULT_COLORS
}) => {
  const { colors: themeColors } = useTheme();
  
  // Format data for PieChart
  const pieData = data.map((item, index) => ({
    value: item.y,
    text: `${Math.round((item.y / data.reduce((sum, d) => sum + d.y, 0)) * 100)}%`,
    color: colors[index % colors.length],
    label: item.x,
    textColor: themeColors.text,
    labelColor: themeColors.text,
  }));

  // Calculate total
  const total = data.reduce((sum, item) => sum + item.y, 0);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.card, width }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
      
      <View style={styles.chartContainer}>
        <PieChart
          data={pieData}
          donut
          showText
          textColor={themeColors.text}
          textSize={12}
          radius={width / 4}
          innerRadius={width / 8}
          centerLabelComponent={() => (
            <View style={styles.centerLabel}>
              <Text style={[styles.centerLabelText, { color: themeColors.textSecondary }]}>Total</Text>
              <Text style={[styles.centerLabelValue, { color: themeColors.text }]}>
                {total.toLocaleString()}
              </Text>
            </View>
          )}
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

// ==================== Time Series Chart ====================
export const GiftedTimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  title,
  width = DEFAULT_CHART_WIDTH,
  height = DEFAULT_CHART_HEIGHT,
  yAxisLabel = '',
  xAxisLabel = '',
  colors = DEFAULT_COLORS,
  legendItems = []
}) => {
  const { colors: themeColors } = useTheme();
  
  // Format data for LineChart
  const formattedData = data.map((series, seriesIndex) => 
    series.map((point, pointIndex) => ({
      value: point.y,
      label: typeof point.x === 'string' ? point.x : point.x.toLocaleDateString(),
      dataPointText: point.y.toString(),
    }))
  );

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
        {formattedData.map((dataset, index) => (
          <LineChart
            key={index}
            data={dataset}
            height={height - 80}
            width={width - 40}
            spacing={width / (dataset.length * 2)}
            color={colors[index % colors.length]}
            thickness={2}
            initialSpacing={10}
            endSpacing={10}
            yAxisColor={themeColors.border}
            xAxisColor={themeColors.border}
            yAxisTextStyle={{ color: themeColors.textSecondary }}
            xAxisLabelTextStyle={{ color: themeColors.textSecondary, fontSize: 10 }}
            hideDataPoints={index > 0} // Only show data points for the first dataset
            hideRules
            yAxisLabelPrefix={yAxisLabel ? `${yAxisLabel} ` : ''}
            yAxisLabelSuffix=""
          />
        ))}
      </View>
      
      {xAxisLabel && (
        <Text style={[styles.axisLabel, { color: themeColors.textSecondary }]}>
          {xAxisLabel}
        </Text>
      )}
    </View>
  );
};

// ==================== Area Chart ====================
export const GiftedAreaChart: React.FC<AreaChartProps> = (props) => {
  // Area chart is essentially a time series chart with different styling
  return <GiftedTimeSeriesChart {...props} />;
};

// ==================== Expense Chart ====================
export const GiftedExpenseChart: React.FC<ExpenseChartProps> = ({ 
  data, 
  title, 
  type, 
  period 
}) => {
  const { colors, isDark } = useTheme();
  const width = DEFAULT_CHART_WIDTH;
  
  // Calculate total amount
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

  if (type === 'pie') {
    // Format data for pie chart
    const pieData = data.map(item => ({
      value: item.amount,
      text: `${Math.round((item.amount / totalAmount) * 100)}%`,
      color: item.color,
      label: item.category,
      textColor: colors.text,
      labelColor: colors.text,
    }));

    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {period && (
          <Text style={[styles.period, { color: colors.textSecondary }]}>{period}</Text>
        )}
        
        <View style={styles.chartContainer}>
          <PieChart
            data={pieData}
            donut
            showText
            textColor={colors.text}
            textSize={12}
            radius={width / 4}
            innerRadius={width / 8}
            centerLabelComponent={() => (
              <View style={styles.centerLabel}>
                <Text style={[styles.centerLabelText, { color: colors.textSecondary }]}>Total</Text>
                <Text style={[styles.centerLabelValue, { color: colors.text }]}>
                  {totalAmount.toLocaleString()}
                </Text>
              </View>
            )}
          />
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
  } else {
    // Format data for bar chart
    const barData = data.map(item => ({
      value: item.amount,
      label: item.category,
      frontColor: item.color,
      topLabelComponent: () => (
        <Text style={{ color: colors.text, fontSize: 10, marginBottom: 4 }}>
          {item.amount.toLocaleString()}
        </Text>
      ),
    }));

    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {period && (
          <Text style={[styles.period, { color: colors.textSecondary }]}>{period}</Text>
        )}
        
        <View style={styles.chartContainer}>
          <BarChart
            data={barData}
            width={width - 40}
            height={DEFAULT_CHART_HEIGHT - 80}
            barWidth={width / (data.length * 3)}
            spacing={width / (data.length * 6)}
            barBorderRadius={4}
            xAxisThickness={1}
            yAxisThickness={1}
            xAxisColor={colors.border}
            yAxisColor={colors.border}
            yAxisTextStyle={{ color: colors.textSecondary }}
            xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
            noOfSections={5}
            maxValue={Math.max(...data.map(item => item.amount)) * 1.2}
            hideRules={false}
            rulesColor={colors.border + '40'}
            rulesType="solid"
          />
        </View>
      </View>
    );
  }
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
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabelText: {
    fontSize: 12,
  },
  centerLabelValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
