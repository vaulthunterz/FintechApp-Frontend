import React from 'react';
import { Platform, View, Text } from 'react-native';
import { WebHeatMap } from './WebCharts';
import { HeatMapProps } from './ChartTypes';

const HeatMap: React.FC<HeatMapProps> = (props) => {
  if (Platform.OS === 'web') {
    return <WebHeatMap {...props} />;
  }
  
  // TODO: Implement mobile HeatMap component
  return (
    <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center' }}>
      <Text>HeatMap is not yet available on mobile</Text>
    </View>
  );
};

export default HeatMap;
