import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Header from '../components/Header';
import MPESATransactionDetector from '../components/MPESATransactionDetector';
import DrawerMenu from '../components/DrawerMenu';

const MPESAHistoryScreen = () => {
  const { colors } = useTheme();
  const [drawerVisible, setDrawerVisible] = React.useState(false);

  const toggleDrawer = () => {
    setDrawerVisible(!drawerVisible);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="M-PESA Transaction Detector"
        showBackButton={true}
        showSettingsIcon={true}
        onMenuPress={toggleDrawer}
      />
      <DrawerMenu isVisible={drawerVisible} onClose={toggleDrawer} />
      <MPESATransactionDetector />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MPESAHistoryScreen;
