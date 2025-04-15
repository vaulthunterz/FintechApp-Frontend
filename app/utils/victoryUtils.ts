/**
 * Chart Utilities
 *
 * This file is kept for backward compatibility.
 * We've migrated from Victory to react-native-gifted-charts.
 */

import React from 'react';

// Create empty components for backward compatibility
const EmptyComponent = () => null;

const VictoryComponents = {
  VictoryPie: EmptyComponent,
  VictoryBar: EmptyComponent,
  VictoryLine: EmptyComponent,
  VictoryChart: EmptyComponent,
  VictoryTheme: { material: {} },
  VictoryAxis: EmptyComponent,
  VictoryLabel: EmptyComponent,
  VictoryLegend: EmptyComponent,
  VictoryTooltip: EmptyComponent,
  VictoryVoronoiContainer: EmptyComponent
};

// Export Victory components
export const {
  VictoryPie,
  VictoryBar,
  VictoryLine,
  VictoryChart,
  VictoryTheme,
  VictoryAxis,
  VictoryLabel,
  VictoryLegend,
  VictoryTooltip,
  VictoryVoronoiContainer
} = VictoryComponents;

export default VictoryComponents;
