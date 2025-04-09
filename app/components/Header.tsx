import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import SettingsDrawer from './SettingsDrawer';

interface HeaderProps {
  showBackButton?: boolean;
  showSettingsIcon?: boolean;
  isRootScreen?: boolean;
  onMenuPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  showBackButton = true,
  showSettingsIcon = true,
  isRootScreen = false,
  onMenuPress,
}) => {
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);

  const goBack = () => {
    router.back();
  };

  const handleDrawerToggle = () => {
    if (onMenuPress) {
      onMenuPress();
    }
  };

  const toggleSettingsDrawer = () => {
    setSettingsDrawerVisible(!settingsDrawerVisible);
  };

  return (
    <View style={styles.header}>
      {isRootScreen ? (
        <TouchableOpacity
          onPress={handleDrawerToggle}
          style={styles.menuButton}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={24} color="white" />
        </TouchableOpacity>
      ) : showBackButton && (
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      )}

      <Text style={styles.headerText}>FinTech App</Text>

      <View style={styles.rightSection}>
        {showSettingsIcon && (
          <TouchableOpacity onPress={toggleSettingsDrawer} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* Settings Drawer - Moved outside the header view for proper rendering */}
      <SettingsDrawer
        isVisible={settingsDrawerVisible}
        onClose={() => setSettingsDrawerVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#1e88e5',
    paddingTop: Platform.OS === 'android' ? 8 : 8,
    paddingBottom: 5,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // iOS shadow properties
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    // Android shadow property
    elevation: 4,
    zIndex: 1000,
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  menuButton: {
    padding: 8,
    zIndex: 1001,
  },
  settingsButton: {
    padding: 8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spacer: {
    width: 40,
  },
});

export default Header;