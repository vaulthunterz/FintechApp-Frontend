import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { LineChart } from 'react-native-gifted-charts';

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

const GiftedAreaChart: React.FC<AreaChartProps> = ({
  data,
  title,
  width = Dimensions.get('window').width - 40,
  height = 300,
  yAxisLabel = '',
  xAxisLabel = '',
  colors = ['rgba(25, 118, 210, 0.8)', 'rgba(244, 67, 54, 0.8)', 'rgba(76, 175, 80, 0.8)'],
  legendItems = []
}) => {
  const { colors: themeColors, isDark } = useTheme();
  
  // Format data for LineChart
  const formattedData = data.map((dataset, datasetIndex) => {
    return dataset.map((point, index) => {
      const xValue = typeof point.x === 'string' ? point.x : point.x.toISOString().split('T')[0];
      return {
        value: point.y,
        label: index % Math.ceil(dataset.length / 5) === 0 ? xValue : '',
        dataPointText: index % Math.ceil(dataset.length / 3) === 0 ? point.y.toString() : '',
        color: colors[datasetIndex % colors.length],
        showDataPoint: index % Math.ceil(dataset.length / 5) === 0,
      };
    });
  });

  return (
    <View style={[styles.container, { backgroundColor: themeColors.card, width }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
      
      {/* Legend */}
      {legendItems.length > 0 && (
        <View style={styles.legendContainer}>
          {legendItems.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, { color: themeColors.textSecondary }]}>
                {item.name}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      {/* Area Chart */}
      <View style={styles.chartContainer}>
        {formattedData.map((dataset, index) => (
          <LineChart
            key={index}
            areaChart
            data={dataset}
            height={height - 80}
            width={width - 40}
            spacing={width / (dataset.length * 2)}
            color={colors[index % colors.length]}
            thickness={2}
            startFillColor={colors[index % colors.length]}
            endFillColor={colors[index % colors.length].replace('0.8', '0.1')}
            startOpacity={0.8}
            endOpacity={0.2}
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
            pointerConfig={{
              pointerStripHeight: height - 80,
              pointerStripColor: themeColors.border,
              pointerStripWidth: 1,
              pointerColor: colors[index % colors.length],
              radius: 5,
              pointerLabelWidth: 100,
              pointerLabelHeight: 40,
              pointerLabelComponent: (items: any) => {
                return (
                  <View style={[styles.tooltip, { backgroundColor: themeColors.card }]}>
                    <Text style={[styles.tooltipText, { color: themeColors.text }]}>
                      {items[0].value}
                    </Text>
                  </View>
                );
              },
            }}
          />
        ))}
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
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    height: 220,
  },
  axisLabel: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 5,
  },
  tooltip: {
    borderRadius: 5,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default GiftedAreaChart;
