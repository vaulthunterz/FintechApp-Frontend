import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { BarChart } from 'react-native-gifted-charts';

interface BarChartProps {
  data: Array<{ x: string; y: number }>;
  title: string;
  width?: number;
  height?: number;
  yAxisLabel?: string;
  xAxisLabel?: string;
  colors?: string[];
}

const GiftedBarChart: React.FC<BarChartProps> = ({
  data,
  title,
  width = Dimensions.get('window').width - 40,
  height = 300,
  yAxisLabel = '',
  xAxisLabel = '',
  colors = ['#1976D2', '#F44336', '#4CAF50', '#FF9800', '#9C27B0', '#795548']
}) => {
  const { colors: themeColors, isDark } = useTheme();
  
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
          showVerticalLines={false}
          disableScroll={true}
        />
      </View>
      
      {/* X-Axis Label */}
      {xAxisLabel && (
        <Text style={[styles.axisLabel, { color: themeColors.textSecondary }]}>
          {xAxisLabel}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
    marginVertical: 10,
  },
  axisLabel: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 5,
  }
});

export default GiftedBarChart;
