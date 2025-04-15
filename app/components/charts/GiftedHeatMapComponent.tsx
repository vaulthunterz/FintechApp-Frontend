import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
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

const GiftedHeatMapComponent: React.FC<HeatMapProps> = ({
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
    },
    label: {
      color: colors.text,
    },
    axisLabel: {
      color: colors.textSecondary,
    }
  };

  // Calculate cell size
  const cellWidth = (width - 80) / xLabels.length;
  const cellHeight = (height - 100) / yLabels.length;

  return (
    <View style={[styles.container, dynamicStyles.container, { width }]}>
      <Text style={[styles.title, dynamicStyles.title]}>{title}</Text>
      
      {/* Y-Axis Label */}
      {yAxisLabel && (
        <Text style={[styles.yAxisLabel, dynamicStyles.axisLabel]}>{yAxisLabel}</Text>
      )}
      
      <View style={styles.chartContainer}>
        {/* Y-Axis Labels */}
        <View style={styles.yAxisLabels}>
          {yLabels.map((label, index) => (
            <Text 
              key={`y-${index}`} 
              style={[styles.axisText, dynamicStyles.axisLabel]}
            >
              {label}
            </Text>
          ))}
        </View>
        
        {/* Heat Map Grid */}
        <View style={styles.gridContainer}>
          {data.map((cell, index) => (
            <View
              key={index}
              style={[
                styles.cell,
                {
                  backgroundColor: getHeatColor(cell.heat),
                  width: cellWidth,
                  height: cellHeight,
                  left: cell.x * cellWidth,
                  top: cell.y * cellHeight,
                }
              ]}
            >
              <Text 
                style={[
                  styles.cellText, 
                  { color: cell.heat > (maxHeat + minHeat) / 2 ? 'white' : 'black' }
                ]}
              >
                {cell.heat.toFixed(0)}
              </Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* X-Axis Labels */}
      <View style={styles.xAxisLabels}>
        {xLabels.map((label, index) => (
          <Text 
            key={`x-${index}`} 
            style={[styles.axisText, dynamicStyles.axisLabel, styles.xLabel]}
          >
            {label}
          </Text>
        ))}
      </View>
      
      {/* X-Axis Label */}
      {xAxisLabel && (
        <Text style={[styles.xAxisLabel, dynamicStyles.axisLabel]}>{xAxisLabel}</Text>
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
  chartContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 5,
  },
  gridContainer: {
    flex: 1,
    height: 200,
    position: 'relative',
  },
  cell: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'white',
  },
  cellText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  yAxisLabels: {
    width: 60,
    marginRight: 5,
    justifyContent: 'space-around',
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingLeft: 65,
    marginTop: 5,
  },
  axisText: {
    fontSize: 10,
  },
  xLabel: {
    transform: [{ rotate: '-45deg' }],
    width: 40,
    textAlign: 'center',
  },
  yAxisLabel: {
    position: 'absolute',
    left: -10,
    top: '50%',
    transform: [{ rotate: '-90deg' }],
    fontSize: 12,
  },
  xAxisLabel: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
  }
});

export default GiftedHeatMapComponent;
