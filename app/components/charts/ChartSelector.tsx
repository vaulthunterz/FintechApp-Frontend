import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

export type ChartType = 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'timeSeries' | 'heatmap';

interface ChartSelectorProps {
  selectedChart: ChartType;
  onSelectChart: (chartType: ChartType) => void;
  availableCharts?: ChartType[];
}

interface ChartOption {
  type: ChartType;
  label: string;
  icon: JSX.Element;
}

const ChartSelector: React.FC<ChartSelectorProps> = ({
  selectedChart,
  onSelectChart,
  availableCharts = ['line', 'bar', 'pie', 'donut', 'area', 'timeSeries', 'heatmap']
}) => {
  const chartOptions: ChartOption[] = [
    {
      type: 'line',
      label: 'Line',
      icon: <Ionicons name="analytics-outline" size={20} color="#1976d2" />
    },
    {
      type: 'bar',
      label: 'Bar',
      icon: <Ionicons name="stats-chart-outline" size={20} color="#f44336" />
    },
    {
      type: 'pie',
      label: 'Pie',
      icon: <FontAwesome5 name="chart-pie" size={18} color="#4caf50" />
    },
    {
      type: 'donut',
      label: 'Donut',
      icon: <MaterialCommunityIcons name="chart-donut" size={20} color="#ff9800" />
    },
    {
      type: 'area',
      label: 'Area',
      icon: <MaterialCommunityIcons name="chart-areaspline" size={20} color="#9c27b0" />
    },
    {
      type: 'timeSeries',
      label: 'Time',
      icon: <MaterialCommunityIcons name="chart-timeline-variant" size={20} color="#795548" />
    },
    {
      type: 'heatmap',
      label: 'Heat',
      icon: <MaterialCommunityIcons name="grid" size={20} color="#607d8b" />
    }
  ].filter(option => availableCharts.includes(option.type));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chart Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.optionsContainer}>
          {chartOptions.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.option,
                selectedChart === option.type && styles.selectedOption
              ]}
              onPress={() => onSelectChart(option.type)}
            >
              {option.icon}
              <Text
                style={[
                  styles.optionLabel,
                  selectedChart === option.type && styles.selectedOptionLabel
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  scrollView: {
    flexGrow: 0,
  },
  optionsContainer: {
    flexDirection: 'row',
    paddingBottom: 5,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  selectedOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
    borderWidth: 1,
  },
  optionLabel: {
    marginLeft: 5,
    fontSize: 12,
    color: '#555',
  },
  selectedOptionLabel: {
    color: '#1976d2',
    fontWeight: 'bold',
  }
});

export default ChartSelector;
