import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { PieChart } from 'react-native-gifted-charts';

interface DonutChartProps {
  data: Array<{ x: string; y: number }>;
  title: string;
  width?: number;
  height?: number;
  colors?: string[];
}

const GiftedDonutChart: React.FC<DonutChartProps> = ({
  data,
  title,
  width = Dimensions.get('window').width - 40,
  height = 300,
  colors = ['#1976D2', '#F44336', '#4CAF50', '#FF9800', '#9C27B0', '#795548']
}) => {
  const { colors: themeColors, isDark } = useTheme();
  
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
      
      {/* Legend */}
      <View style={styles.legendContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors[index % colors.length] }]} />
            <Text style={[styles.legendText, { color: themeColors.textSecondary }]}>
              {item.x}: {item.y.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
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
    marginVertical: 20,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
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
  centerLabel: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLabelText: {
    fontSize: 12,
  },
  centerLabelValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default GiftedDonutChart;
