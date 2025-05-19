import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCurrency, formatTooltipValue, getAbbreviatedLabel } from '../../utils/chartUtils';
import { 
  BarChart,
  DonutChart,
  TimeSeriesChart,
  ChartSelector
} from './index';
import { DEFAULT_COLORS } from './ChartTypes';

type ChartType = 'line' | 'bar' | 'pie' | 'donut' | 'timeSeries';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string | { id: string; name: string };
  date?: string;
  is_expense: boolean;
  merchant_name?: string;
  time_of_transaction?: string;
  transaction_id?: string;
}

interface FinancialDataVisualizerProps {
  transactions: Transaction[];
  timePeriod: string;
  width?: number;
}

const FinancialDataVisualizer: React.FC<FinancialDataVisualizerProps> = ({
  transactions,
  timePeriod,
  width = Dimensions.get('window').width - 40
}) => {
  const [selectedChart, setSelectedChart] = useState<ChartType>('bar');
  const [availableCharts, setAvailableCharts] = useState<ChartType[]>(['line', 'bar', 'pie', 'donut']);

  // Chart data states
  const [barData, setBarData] = useState<any>(null);
  const [pieData, setPieData] = useState<any>(null);
  const [lineData, setLineData] = useState<any>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<any>(null);

  // Process transactions data for different chart types
  useEffect(() => {
    if (!transactions || transactions.length === 0) return;

    // Calculate total income, expenses, and net
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(transaction => {
      const amount = typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount;
      if (!isNaN(amount)) {
        if (transaction.is_expense) {
          totalExpenses += amount;
        } else {
          totalIncome += amount;
        }
      }
    });

    const netAmount = totalIncome - totalExpenses;

    // Prepare line chart data with formatted values
    const lineChartData = {
      labels: ["Income", "Expenses", "Net"],
      datasets: [
        {
          data: [totalIncome, totalExpenses, netAmount],
          colors: ['#4CAF50', '#F44336', '#2196F3']
        }
      ]
    };
    setLineData(lineChartData);

    // Prepare bar chart data with formatted values
    const barChartData = [
      { 
        x: "Income", 
        y: totalIncome,
        label: formatCurrency(totalIncome),
        color: '#4CAF50'
      },
      { 
        x: "Expenses", 
        y: totalExpenses,
        label: formatCurrency(totalExpenses),
        color: '#F44336'
      },
      { 
        x: "Net", 
        y: netAmount,
        label: formatCurrency(netAmount),
        color: netAmount >= 0 ? '#2196F3' : '#FF9800'
      }
    ];
    setBarData(barChartData);

    // Process category data for pie/donut charts
    const categoryMap = new Map();
    transactions.forEach(transaction => {
      if (transaction.is_expense) {
        const amount = typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount;
        const categoryName = typeof transaction.category === 'string'
          ? transaction.category
          : transaction.category?.name || 'Uncategorized';

        if (!isNaN(amount)) {
          const currentAmount = categoryMap.get(categoryName)?.amount || 0;
          const count = categoryMap.get(categoryName)?.count || 0;
          categoryMap.set(categoryName, {
            amount: currentAmount + amount,
            count: count + 1
          });
        }
      }
    });
    
    // Convert to array and sort by amount (descending)
    const sortedCategories = Array.from(categoryMap.entries())
      .map(([name, { amount }]) => ({
        name,
        amount,
        percentage: (amount / totalExpenses) * 100
      }))
      .sort((a, b) => b.amount - a.amount);
      
    // Limit to top 5 categories and group the rest as 'Others'
    const topCategories = sortedCategories.slice(0, 5);
    const otherCategories = sortedCategories.slice(5);
    const otherTotal = otherCategories.reduce((sum, cat) => sum + cat.amount, 0);
    
    if (otherTotal > 0) {
      topCategories.push({
        name: 'Others',
        amount: otherTotal,
        percentage: (otherTotal / totalExpenses) * 100
      });
    }

    // Convert category map to array and sort by amount
    const categorySummary = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 categories

    // Prepare pie chart data
    const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"];
    const pieChartData = categorySummary.map((item, index) => ({
      name: item.category,
      amount: item.amount,
      color: colors[index % colors.length],
      legendFontColor: "#7F7F7F",
      legendFontSize: 12
    }));
    setPieData(pieChartData);

    // Prepare donut chart data
    const donutChartData = categorySummary.map(item => ({
      x: item.category,
      y: item.amount
    }));

    // Prepare time series data
    // This is a simplified example - in a real app, you'd use actual dates
    const timeSeriesData = [
      [
        { x: "Jan", y: totalExpenses * 0.8 },
        { x: "Feb", y: totalExpenses * 0.9 },
        { x: "Mar", y: totalExpenses * 1.1 },
        { x: "Apr", y: totalExpenses * 1.0 },
        { x: "May", y: totalExpenses * 1.2 },
        { x: "Jun", y: totalExpenses }
      ]
    ];
    setTimeSeriesData(timeSeriesData);

    // Update available charts based on data
    const charts: ChartType[] = ['line', 'bar'];
    if (pieChartData.length > 0) charts.push('pie', 'donut');
    if (transactions.length > 5) charts.push('timeSeries');

    setAvailableCharts(charts);
  }, [transactions, timePeriod]);

  // Render the selected chart type
  const renderChart = () => {
    switch (selectedChart) {
      case 'bar':
        return (
          <BarChart
            data={barData || []}
            title="Financial Overview"
            yAxisLabel="KES"
            colors={['#4CAF50', '#F44336', '#2196F3']}
          />
        );

      case 'donut':
        return (
          <DonutChart
            data={pieData || []}
            title="Expense Breakdown"
            colors={DEFAULT_COLORS}
          />
        );

      case 'timeSeries':
        return (
          <TimeSeriesChart
            data={timeSeriesData || []}
            title="Transaction History"
            yAxisLabel="KES"
            colors={DEFAULT_COLORS}
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { width }]}>
      <ChartSelector
        selectedChart={selectedChart}
        availableCharts={availableCharts}
        onSelectChart={setSelectedChart}
      />
      {renderChart()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  chartContainer: {
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
  chart: {
    marginVertical: 8,
    borderRadius: 10,
  }
});

export default FinancialDataVisualizer;
