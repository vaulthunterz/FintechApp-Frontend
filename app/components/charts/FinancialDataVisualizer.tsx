import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  BarChartComponent,
  AreaChartComponent,
  DonutChartComponent,
  TimeSeriesChartComponent,
  ChartSelector,
  ChartType
} from './index';

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
  const [selectedChart, setSelectedChart] = useState<ChartType>('line');
  const [availableCharts, setAvailableCharts] = useState<ChartType[]>(['line', 'bar', 'pie', 'donut']);

  // Chart data states
  const [barData, setBarData] = useState<any>(null);
  const [pieData, setPieData] = useState<any>(null);
  const [lineData, setLineData] = useState<any>(null);
  const [areaData, setAreaData] = useState<any>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<any>(null);
  const [heatMapData, setHeatMapData] = useState<any>(null);

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
    transactions.forEach(transaction => {
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
    if (transactions.length > 5) charts.push('area', 'timeSeries');
    if (transactions.length > 10) charts.push('heatmap');

    setAvailableCharts(charts);
  }, [transactions, timePeriod]);

  // Chart configuration
  const chartConfig = {
    backgroundColor: "#fff",
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(30, 136, 229, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#1e88e5",
    },
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
      case 'donut':
        return pieData && pieData.length > 0 ? (
          <DonutChartComponent
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
          <TimeSeriesChartComponent
            data={timeSeriesData}
            title="Monthly Expense Trend"
            yAxisLabel="Amount"
            xAxisLabel="Month"
            legendItems={[{ name: 'Expenses', color: '#1976d2' }]}
          />
        ) : null;

      case 'heatmap':
        // Heatmap is not implemented in the consolidated files yet
        return null;

      case 'line':
      default:
        return lineData ? (
          <TimeSeriesChartComponent
            data={[lineData.datasets[0].data.map((y, i) => ({ x: lineData.labels[i], y }))]}
            title="Income vs. Expenses"
            yAxisLabel="Amount"
            xAxisLabel="Category"
            legendItems={[{ name: 'Overview', color: '#1e88e5' }]}
          />
        ) : null;
    }
  };

  return (
    <View style={styles.container}>
      <ChartSelector
        selectedChart={selectedChart}
        onSelectChart={setSelectedChart}
        availableCharts={availableCharts}
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
