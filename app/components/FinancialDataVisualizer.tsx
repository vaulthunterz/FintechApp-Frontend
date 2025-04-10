import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { LineChart, PieChart } from 'react-native-chart-kit';
import BarChartComponent from './charts/BarChartComponent';
import AreaChartComponent from './charts/AreaChartComponent';
import WebDonutChart from './charts/WebDonutChart';
import WebTimeSeriesChart from './charts/WebTimeSeriesChart';
import HeatMapComponent from './charts/HeatMapComponent';
import ChartSelector from './charts/ChartSelector';
import type { ChartType } from './charts/ChartSelector';
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
  const [selectedChart, setSelectedChart] = useState<ChartType>('line');
  const [availableCharts, setAvailableCharts] = useState<ChartType[]>(['line', 'bar', 'pie', 'donut']);
  const [filters, setFilters] = useState<FilterOptions>(getDefaultFilters());
  const [filteredData, setFilteredData] = useState<Transaction[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Chart data states
  const [barData, setBarData] = useState<any>(null);
  const [pieData, setPieData] = useState<any>(null);
  const [lineData, setLineData] = useState<any>(null);
  const [areaData, setAreaData] = useState<any>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<any>(null);
  const [heatMapData, setHeatMapData] = useState<any>(null);

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

    // Prepare donut chart data
    const donutChartData = categorySummary.map(item => ({
      x: item.category,
      y: item.amount
    }));

    // Prepare area chart data (monthly expenses by category)
    // This is a simplified example - in a real app, you'd group by month
    const areaChartData = [
      categorySummary.map((item, index) => ({
        x: index.toString(),
        y: item.amount
      }))
    ];
    setAreaData(areaChartData);

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

    // Prepare heatmap data (day of week vs. time of day)
    // This is a simplified example with random data
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const times = ["Morning", "Afternoon", "Evening", "Night"];

    const heatmapData = [];
    for (let i = 0; i < days.length; i++) {
      for (let j = 0; j < times.length; j++) {
        // Random spending amount between 10 and 100
        const heat = Math.floor(Math.random() * 90) + 10;
        heatmapData.push({ x: i, y: j, heat });
      }
    }

    setHeatMapData({
      data: heatmapData,
      xLabels: days,
      yLabels: times
    });

    // Update available charts based on data
    const charts: ChartType[] = ['line', 'bar'];
    if (pieChartData.length > 0) charts.push('pie', 'donut');
    if (filteredData.length > 5) charts.push('area', 'timeSeries');
    if (filteredData.length > 10) charts.push('heatmap');

    setAvailableCharts(charts);
  }, [filteredData]);

  // Chart configuration
  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 2,
    color: (opacity = 1) => {
      // Convert hex to rgba
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
      };

      const rgb = hexToRgb(colors.primary);
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    },
    labelColor: (opacity = 1) => {
      const rgb = hexToRgb(colors.text);
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    },
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: colors.primary,
    },
  };

  // Helper function to convert hex to rgb
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

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
        return pieData && pieData.length > 0 ? (
          <View style={[styles.chartContainer, dynamicStyles.chartContainer]}>
            <PieChart
              data={pieData}
              width={width}
              height={220}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              avoidFalseZero
            />
          </View>
        ) : null;

      case 'donut':
        return pieData && pieData.length > 0 ? (
          <WebDonutChart
            data={pieData.map(item => ({ x: item.name, y: item.amount }))}
            title="Expense Categories"
            colors={pieData.map(item => item.color)}
          />
        ) : null;

      case 'area':
        return areaData ? (
          <AreaChartComponent
            data={areaData}
            title="Expense Trends by Category"
            yAxisLabel="Amount"
            xAxisLabel="Categories"
            legendItems={pieData?.map(item => ({ name: item.name, color: item.color })) || []}
          />
        ) : null;

      case 'timeSeries':
        return timeSeriesData ? (
          <WebTimeSeriesChart
            data={timeSeriesData}
            title="Monthly Expense Trend"
            yAxisLabel="Amount"
            xAxisLabel="Month"
            legendItems={[{ name: 'Expenses', color: '#1976d2' }]}
          />
        ) : null;

      case 'heatmap':
        return heatMapData ? (
          <HeatMapComponent
            data={heatMapData.data}
            title="Spending Patterns (Day vs. Time)"
            xAxisLabel="Day of Week"
            yAxisLabel="Time of Day"
            xLabels={heatMapData.xLabels}
            yLabels={heatMapData.yLabels}
          />
        ) : null;

      case 'line':
      default:
        return lineData ? (
          <View style={[styles.chartContainer, dynamicStyles.chartContainer]}>
            <LineChart
              data={lineData as any}
              width={width}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
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
