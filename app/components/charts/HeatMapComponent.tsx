import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import GiftedHeatMapComponent from './GiftedHeatMapComponent';
import { useTheme } from '../../contexts/ThemeContext';

interface HeatMapProps {
  data: Array<{ x: number; y: number; heat: number }>;
  title: string;
  width?: number;
  height?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
  xLabels?: string[];
  yLabels?: string[];
}

const HeatMapComponent: React.FC<HeatMapProps> = ({
  data,
  title,
  width = Dimensions.get('window').width - 40,
  height = 300,
  xAxisLabel = '',
  yAxisLabel = '',
  xLabels = [],
  yLabels = []
}) => {
  const { colors } = useTheme();
  // Find min and max heat values for color scaling
  const heatValues = data.map(d => d.heat);
  const minHeat = Math.min(...heatValues);
  const maxHeat = Math.max(...heatValues);

  // Color scale function
  const getHeatColor = (heat: number) => {
    // Normalize heat value between 0 and 1
    const normalizedHeat = (heat - minHeat) / (maxHeat - minHeat);

    // Blue to red color scale
    const r = Math.round(normalizedHeat * 255);
    const b = Math.round(255 - (normalizedHeat * 255));
    const g = Math.round(100 - (normalizedHeat * 100));

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Create dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: colors.card,
    },
    title: {
      color: colors.text,
    }
  };

  return (
    <GiftedHeatMapComponent
      data={data}
      title={title}
      width={width}
      height={height}
      xAxisLabel={xAxisLabel}
      yAxisLabel={yAxisLabel}
      xLabels={xLabels}
      yLabels={yLabels}
    />
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
  }
});

export default HeatMapComponent;
