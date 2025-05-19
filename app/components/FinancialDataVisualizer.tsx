import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import {
  BarChartComponent,
  DonutChartComponent,
  TimeSeriesChartComponent,
  ChartSelector,
  ChartType
} from './charts';
import FilterControls, { FilterOptions } from './filters/FilterControls';
import { filterTransactions, extractCategories, getDefaultFilters } from '../utils/filterUtils';

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
  timePeriod?: string;
  width?: number;
  showFilters?: boolean;
}

const FinancialDataVisualizer: React.FC<FinancialDataVisualizerProps> = ({
  transactions,
  timePeriod = 'all',
  width = Dimensions.get('window').width - 40,
  showFilters = true
}) => {
  const { colors } = useTheme();
  const [selectedChart, setSelectedChart] = useState<ChartType>('bar');
  const [availableCharts, setAvailableCharts] = useState<ChartType[]>(['line', 'bar', 'pie', 'donut', 'timeSeries']);
  const [filters, setFilters] = useState<FilterOptions>(getDefaultFilters());
  const [filteredData, setFilteredData] = useState<Transaction[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Chart data states
  const [barData, setBarData] = useState<any>(null);
  const [pieData, setPieData] = useState<any>(null);
  const [lineData, setLineData] = useState<any>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<any>(null);

  // Extract categories from transactions
  useEffect(() => {
    if (!transactions || transactions.length === 0) return;
    const categories = extractCategories(transactions);
    setAvailableCategories(categories);
  }, [transactions]);

  // Apply filters to transactions
  useEffect(() => {
    if (!transactions || transactions.length === 0) return;
    const filtered = filterTransactions(transactions, filters);
    setFilteredData(filtered);
  }, [transactions, filters]);

  // Process transactions data for different chart types
  useEffect(() => {
    if (!filteredData || filteredData.length === 0) return;

    // Calculate total income, expenses, and net
    let totalIncome = 0;
    let totalExpenses = 0;

    filteredData.forEach(transaction => {
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

    // Prepare line chart data
    const lineChartData = {
      labels: ["Income", "Expenses", "Net"],
      datasets: [
        {
          data: [totalIncome, totalExpenses, netAmount]
        }
      ]
    };
    setLineData(lineChartData);

    // Prepare bar chart data
    const barChartData = [
      { x: "Income", y: totalIncome },
      { x: "Expenses", y: totalExpenses },
      { x: "Net", y: netAmount }
    ];
    setBarData(barChartData);

    // Process category data for pie/donut charts
    const categoryMap = new Map();
    filteredData.forEach(transaction => {
      if (transaction.is_expense) {
        const amount = typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount;
        const categoryName = typeof transaction.category === 'string'
          ? transaction.category
          : transaction.category?.name || 'Uncategorized';

        if (!isNaN(amount)) {
          const currentAmount = categoryMap.get(categoryName) || 0;
          categoryMap.set(categoryName, currentAmount + amount);
        }
      }
    });

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

    // Pie and donut charts use the same data in our consolidated version

    // Update available charts based on data
    const charts: ChartType[] = ['line', 'bar'];
    if (pieChartData.length > 0) charts.push('pie', 'donut');
    if (filteredData.length > 5) charts.push('timeSeries');

    setAvailableCharts(charts);
  }, [filteredData]);

  // Our consolidated chart components handle their own styling based on the theme

  // Render the selected chart type
  const renderChart = () => {
    switch (selectedChart) {
      case 'bar':
        return barData ? (
          <BarChartComponent
            data={barData}
            title="Income vs. Expenses"
            yAxisLabel="Amount"
            colors={['#4CAF50', '#F44336', '#1976D2']}
          />
        ) : null;

      case 'pie':
      case 'donut':
        return pieData && pieData.length > 0 ? (
          <DonutChartComponent
            data={pieData.map((item: {name: string; amount: number; color: string}) => ({ x: item.name, y: item.amount }))}
            title="Expense Categories"
            colors={pieData.map((item: {color: string}) => item.color)}
          />
        ) : null;

      case 'timeSeries':
        return timeSeriesData ? (
          <TimeSeriesChartComponent
            data={timeSeriesData}
            title="Monthly Expense Trend"
            yAxisLabel="Amount"
            xAxisLabel="Month"
            legendItems={[{ name: 'Expenses', color: '#1976d2' }]}
          />
        ) : null;

      case 'line':
      default:
        return lineData ? (
          <TimeSeriesChartComponent
            data={[lineData.datasets[0].data.map((y: number, i: number) => ({ x: lineData.labels[i], y }))]}
            title="Income vs. Expenses"
            yAxisLabel="Amount"
            xAxisLabel="Category"
            legendItems={[{ name: 'Overview', color: '#1e88e5' }]}
          />
        ) : null;
    }
  };

  // Create dynamic styles based on theme
  const dynamicStyles = {
    noDataContainer: {
      backgroundColor: colors.card,
    },
    noDataText: {
      color: colors.textSecondary,
    },
    chartContainer: {
      backgroundColor: colors.card,
    }
  };

  return (
    <View style={styles.container}>
      {showFilters && (
        <FilterControls
          availableCategories={availableCategories}
          filters={filters}
          onFiltersChange={setFilters}
        />
      )}

      <View style={styles.chartSelectionContainer}>
        <ChartSelector
          selectedChart={selectedChart}
          onSelectChart={setSelectedChart}
          availableCharts={availableCharts}
        />
      </View>

      {filteredData.length === 0 ? (
        <View style={[styles.noDataContainer, dynamicStyles.noDataContainer]}>
          <Text style={[styles.noDataText, dynamicStyles.noDataText]}>No data available for the selected filters</Text>
        </View>
      ) : (
        renderChart()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  chartSelectionContainer: {
    marginBottom: 10,
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 10,
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
  },
  chartContainer: {
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
