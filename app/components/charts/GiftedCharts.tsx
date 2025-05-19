/**
 * Consolidated Gifted Charts implementations
 */
import React from 'react';
import { formatCurrency, formatTooltipValue, getAbbreviatedLabel } from '../../utils/chartUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { View, Text, StyleSheet, ScrollView, ViewStyle, TextStyle } from 'react-native';
import {
  BarChart as GiftedBarChartBase,
  LineChart as GiftedLineChartBase,
  PieChart as GiftedPieChartBase,
  BarChart as BarChart,
  PieChart as PieChart,
  pieDataItem
} from 'react-native-gifted-charts';
import {
  BarChartProps,
  DonutChartProps,
  TimeSeriesChartProps,
  ExpenseChartProps,
  DEFAULT_CHART_WIDTH,
  DEFAULT_CHART_HEIGHT,
  DEFAULT_COLORS
} from './ChartTypes';

// Extended type for chart data points
export interface ExtendedChartDataPoint {
  color?: string;
  text?: string;
  label?: string;
  textColor?: string;
  labelColor?: string;
  labelTextStyle?: TextStyle;
  tooltipComponent?: () => React.ReactNode;
}

// ==================== Bar Chart ====================
export const GiftedBarChart: React.FC<BarChartProps> = ({
  data,
  title,
  width = DEFAULT_CHART_WIDTH,
  height = DEFAULT_CHART_HEIGHT,
  yAxisLabel = 'Amount (KES)',
  xAxisLabel = '',
  colors = DEFAULT_COLORS
}) => {
  const { colors: themeColors } = useTheme();

  // Calculate total for percentages
  const total = data.reduce((sum: number, item: { y: number }) => sum + item.y, 0);

  // Format data for BarChart
  const barData = data.map((item, index) => ({
    value: item.y,
    label: getAbbreviatedLabel(item.x, 10),
    frontColor: colors[index % colors.length],
    topLabelComponent: () => (
      <Text style={{ 
        color: themeColors.text, 
        fontSize: 10, 
        marginBottom: 4,
        textAlign: 'center',
        width: 60
      }}>
        {formatTooltipValue(item.y, total)}
      </Text>
    ),
  }));

  return (
    <View style={{ width, height }}>
      {title && (
        <Text style={[styles.chartTitle, { color: themeColors.text }]}>
          {title}
        </Text>
      )}
      <GiftedBarChartBase
        data={barData}
        barWidth={22}
        spacing={24}
        roundedTop
        roundedBottom
        hideRules
        xAxisLabelTextStyle={[styles.axisLabel, { color: themeColors.text }]}
        yAxisTextStyle={[styles.axisLabel, { color: themeColors.text }]}
        yAxisLabel={yAxisLabel}
        xAxisLabel={xAxisLabel}
        noOfSections={5}
        maxValue={Math.max(...data.map(item => item.y)) * 1.1}
        isAnimated
        showReferenceLine1
        referenceLine1Position="top"
        referenceLine1LabelPosition="left"
        referenceLine1LabelTextStyle={{ color: themeColors.text }}
        referenceLine1LabelWidth={80}
        referenceLine1LabelText={`Max: ${formatCurrency(
          Math.max(...data.map(item => item.y))
        )}`}
        referenceLine1Color={themeColors.primary}
        referenceLine1Thickness={1}
        referenceLine1Type="dashed"
        referenceLine1DashWidth={4}
        referenceLine1DashGap={3}
        showReferenceLine2
        referenceLine2Position="bottom"
        referenceLine2LabelPosition="right"
        referenceLine2LabelTextStyle={{ color: themeColors.text }}
        referenceLine2LabelWidth={80}
        referenceLine2LabelText={`Min: ${formatCurrency(
          Math.min(...data.map(item => item.y))
        )}`}
        referenceLine2Color={themeColors.secondary}
        referenceLine2Thickness={1}
        referenceLine2Type="dashed"
        referenceLine2DashWidth={4}
        referenceLine2DashGap={3}
        showGradient
        gradientColor={themeColors.primary}
        gradientEndColor={themeColors.secondary}
        backgroundColor={themeColors.background}
        labelWidth={80}
        initialSpacing={10}
        endSpacing={10}
        yAxisOffset={20}
        xAxisOffset={10}
        yAxisExtraHeight={30}
        xAxisExtraHeight={20}
        showVerticalLines
        verticalLinesColor={themeColors.border}
        verticalLinesThickness={0.5}
        verticalLinesType="dashed"
        verticalLinesDashWidth={2}
        verticalLinesDashGap={3}
        showHorizontalLines
        horizontalLinesColor={themeColors.border}
        horizontalLinesThickness={0.5}
        horizontalLinesType="dashed"
        horizontalLinesDashWidth={2}
        horizontalLinesDashGap={3}
        showValuesAsTopLabel
        topLabelContainerStyle={{ paddingBottom: 4 }}
        topLabelTextStyle={[styles.legendText, { color: themeColors.text }]}
      />
    </View>
  );
};

// ==================== Donut Chart ====================
export const GiftedDonutChart: React.FC<DonutChartProps> = ({
  data,
  title,
  width = DEFAULT_CHART_WIDTH,
  colors = DEFAULT_COLORS
}) => {
  const { colors: themeColors } = useTheme();

  // Calculate total for percentages and tooltips
  const total = data.reduce((sum, item) => sum + item.y, 0);

  // Format data for PieChart
  const pieData: pieDataItem[] = data.map((item, index) => ({
    value: item.y,
    text: `${Math.round((item.y / total) * 100)}%`,
    color: colors[index % colors.length],
    label: getAbbreviatedLabel(item.x, 12),
    textColor: themeColors.text,
    labelColor: themeColors.text,
    labelTextStyle: { fontSize: 10 },
    // Add formatted value to the tooltip
    tooltipComponent: () => (
      <View style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 6,
        borderRadius: 4,
      }}>
        <Text style={{ color: 'white', fontSize: 10 }}>
          {item.x}
        </Text>
        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
          {formatTooltipValue(item.y, total)}
        </Text>
      </View>
    ),
  }));

  return (
    <View style={[styles.container, { backgroundColor: themeColors.card, width }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>

      <View style={styles.chartContainer}>
        <GiftedPieChartBase
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
  const formattedData = data.map((series) =>
    series.map((point) => ({
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
          <GiftedLineChartBase
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

// ==================== Expense Chart ====================
export const GiftedExpenseChart: React.FC<ExpenseChartProps> = ({
  data,
  title,
  type,
  period
}) => {
  const { colors } = useTheme();
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
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  heatmapCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  axisLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  legendContainer: {
    marginTop: 16,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginRight: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#999',
  },
  legendText: {
    fontSize: 12,
  },
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
  legend: {
    marginTop: 16,
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

// Default export for Expo Router
const GiftedCharts = {
  GiftedBarChart,
  GiftedDonutChart,
  GiftedTimeSeriesChart,
  GiftedExpenseChart
};

export default GiftedCharts;
