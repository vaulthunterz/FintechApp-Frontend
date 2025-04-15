import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { PieChart, BarChart } from 'react-native-gifted-charts';

interface ExpenseData {
  category: string;
  amount: number;
  color: string;
}

interface GiftedExpenseChartProps {
  data: ExpenseData[];
  title: string;
  type: 'pie' | 'bar';
  period?: string;
}

const GiftedExpenseChart: React.FC<GiftedExpenseChartProps> = ({ data, title, type, period }) => {
  const { colors, isDark } = useTheme();
  const screenWidth = Dimensions.get('window').width - 40;

  // Format data for Gifted Charts
  const pieData = data.map(item => ({
    value: item.amount,
    text: `${Math.round((item.amount / data.reduce((sum, d) => sum + d.amount, 0)) * 100)}%`,
    color: item.color,
    label: item.category,
    textColor: colors.text,
    labelColor: colors.text,
  }));

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

  // Calculate total amount
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {period && (
        <Text style={[styles.period, { color: colors.textSecondary }]}>{period}</Text>
      )}
      
      <View style={styles.chartContainer}>
        {type === 'pie' ? (
          <PieChart
            data={pieData}
            donut
            showText
            textColor={colors.text}
            textSize={12}
            radius={screenWidth / 4}
            innerRadius={screenWidth / 8}
            centerLabelComponent={() => (
              <View style={styles.centerLabel}>
                <Text style={[styles.centerLabelText, { color: colors.textSecondary }]}>Total</Text>
                <Text style={[styles.centerLabelValue, { color: colors.text }]}>
                  {totalAmount.toLocaleString()}
                </Text>
              </View>
            )}
          />
        ) : (
          <BarChart
            data={barData}
            width={screenWidth}
            height={220}
            barWidth={screenWidth / (data.length * 2)}
            spacing={screenWidth / (data.length * 4)}
            barBorderRadius={4}
            xAxisThickness={1}
            yAxisThickness={1}
            xAxisColor={colors.border}
            yAxisColor={colors.border}
            yAxisTextStyle={{ color: colors.textSecondary }}
            xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
            noOfSections={5}
            maxValue={Math.max(...data.map(item => item.amount)) * 1.2}
            yAxisLabelPrefix=""
            yAxisLabelSuffix=""
            hideYAxisText={false}
            showFractionalValues={false}
            showXAxisLabels={true}
            showYAxisLabels={true}
            hideRules={false}
            rulesColor={colors.border + '40'}
            rulesType="solid"
          />
        )}
      </View>
      
      {/* Legend */}
      <View style={styles.legendContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              {item.category}: {item.amount.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
      
      <View style={[styles.totalContainer, { borderTopColor: colors.border }]}>
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
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    marginRight: 5,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
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

export default GiftedExpenseChart;
