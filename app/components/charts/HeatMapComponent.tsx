import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryTheme, VictoryLabel, VictoryAxis, VictoryChart, VictoryHeatmap } from 'victory-native';

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

  return (
    <View style={[styles.container, { width }]}>
      <Text style={styles.title}>{title}</Text>
      <VictoryChart
        width={width}
        height={height}
        theme={VictoryTheme.material}
        domain={{ x: [0, xLabels.length], y: [0, yLabels.length] }}
        padding={{ top: 40, bottom: 50, left: 60, right: 20 }}
      >
        <VictoryAxis
          tickValues={Array.from({ length: xLabels.length }, (_, i) => i + 0.5)}
          tickFormat={(t, i) => xLabels[i] || ''}
          style={{
            tickLabels: { fontSize: 10, padding: 5, angle: -45, textAnchor: 'end' }
          }}
          label={xAxisLabel}
          axisLabelComponent={<VictoryLabel dy={25} />}
        />
        <VictoryAxis
          dependentAxis
          tickValues={Array.from({ length: yLabels.length }, (_, i) => i + 0.5)}
          tickFormat={(t, i) => yLabels[i] || ''}
          style={{
            tickLabels: { fontSize: 10, padding: 5 }
          }}
          label={yAxisLabel}
          axisLabelComponent={<VictoryLabel dy={-40} />}
        />
        <VictoryHeatmap
          data={data}
          style={{
            data: {
              fill: ({ datum }) => getHeatColor(datum.heat),
              stroke: "#ffffff",
              strokeWidth: 1
            }
          }}
          animate={{
            duration: 500,
            onLoad: { duration: 300 }
          }}
          labels={({ datum }) => `$${datum.heat.toFixed(0)}`}
          labelComponent={
            <VictoryLabel 
              style={{ 
                fill: ({ datum }) => (datum.heat > (maxHeat + minHeat) / 2) ? 'white' : 'black',
                fontSize: 9
              }} 
            />
          }
        />
      </VictoryChart>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  }
});

export default HeatMapComponent;
