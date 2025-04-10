import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Animated,
  Dimensions,
  Modal
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

interface InvestmentSettingsDrawerProps {
  isVisible: boolean;
  onClose: () => void;
}

const InvestmentSettingsDrawer: React.FC<InvestmentSettingsDrawerProps> = ({ isVisible, onClose }) => {
  const { logout } = useAuth();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [autoInvest, setAutoInvest] = React.useState(false);
  const [riskAlerts, setRiskAlerts] = React.useState(true);
  const [performanceNotifications, setPerformanceNotifications] = React.useState(true);

  // Create animated value for sliding from right
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;

  // Handle animation when visibility changes
  useEffect(() => {
    if (isVisible) {
      // Slide in from right
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide out to right
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, slideAnim]);

  const handleUpdateProfile = () => {
    onClose();
    router.push({
      pathname: '/screens/profile',
      params: { source: 'investment' }
    });
  };

  const handleStartQuestionnaire = () => {
    onClose();
    router.push('/screens/investment-questionnaire');
  };

  const handleViewRecommendations = () => {
    onClose();
    // Navigate to recommendations screen
    // This would be implemented in a real app
    console.log('Navigate to recommendations');
  };

  // Create dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: colors.card,
      shadowColor: isDark ? '#000' : '#000',
    },
    title: {
      color: colors.text,
    },
    sectionTitle: {
      color: colors.text,
    },
    settingText: {
      color: colors.text,
    },
    settingItem: {
      borderBottomColor: colors.border,
    },
    versionText: {
      color: colors.textSecondary,
    }
  };

  return (
    <Modal
      animationType="none" // Disable default animation
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Removed the dark backdrop */}
        <TouchableOpacity style={styles.invisibleBackdrop} onPress={onClose} />
        <Animated.View
          style={[
            styles.container,
            dynamicStyles.container,
            {
              transform: [{ translateX: slideAnim }],
              paddingTop: insets.top > 0 ? insets.top : 20,
              paddingBottom: insets.bottom > 0 ? insets.bottom : 20
            }
          ]}
        >
        <View style={styles.header}>
          <Text style={[styles.title, dynamicStyles.title]}>Investment Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Actions Section (moved from main screen) */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Investment Actions</Text>

            <TouchableOpacity style={[styles.settingItem, dynamicStyles.settingItem]} onPress={handleUpdateProfile}>
              <View style={styles.settingInfo}>
                <Ionicons name="briefcase" size={24} color={colors.primary} style={styles.settingIcon} />
                <Text style={[styles.settingText, dynamicStyles.settingText]}>User Portfolio</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingItem, dynamicStyles.settingItem]} onPress={handleStartQuestionnaire}>
              <View style={styles.settingInfo}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={24} color={colors.secondary} style={styles.settingIcon} />
                <Text style={[styles.settingText, dynamicStyles.settingText]}>Investment Questionnaire</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingItem, dynamicStyles.settingItem]} onPress={handleViewRecommendations}>
              <View style={styles.settingInfo}>
                <FontAwesome5 name="chart-pie" size={20} color={colors.accent} style={styles.settingIcon} />
                <Text style={[styles.settingText, dynamicStyles.settingText]}>View Recommendations</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Investment Preferences */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Investment Preferences</Text>

            <View style={[styles.settingItem, dynamicStyles.settingItem]}>
              <View style={styles.settingInfo}>
                <Ionicons name="trending-up" size={24} color={colors.text} style={styles.settingIcon} />
                <Text style={[styles.settingText, dynamicStyles.settingText]}>Auto-Invest</Text>
              </View>
              <Switch
                value={autoInvest}
                onValueChange={setAutoInvest}
                trackColor={{ false: "#767577", true: colors.primary + '80' }}
                thumbColor={autoInvest ? colors.primary : "#f4f3f4"}
              />
            </View>

            <View style={[styles.settingItem, dynamicStyles.settingItem]}>
              <View style={styles.settingInfo}>
                <Ionicons name="warning-outline" size={24} color={colors.text} style={styles.settingIcon} />
                <Text style={[styles.settingText, dynamicStyles.settingText]}>Risk Alerts</Text>
              </View>
              <Switch
                value={riskAlerts}
                onValueChange={setRiskAlerts}
                trackColor={{ false: "#767577", true: colors.primary + '80' }}
                thumbColor={riskAlerts ? colors.primary : "#f4f3f4"}
              />
            </View>

            <View style={[styles.settingItem, dynamicStyles.settingItem]}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications-outline" size={24} color={colors.text} style={styles.settingIcon} />
                <Text style={[styles.settingText, dynamicStyles.settingText]}>Performance Notifications</Text>
              </View>
              <Switch
                value={performanceNotifications}
                onValueChange={setPerformanceNotifications}
                trackColor={{ false: "#767577", true: colors.primary + '80' }}
                thumbColor={performanceNotifications ? colors.primary : "#f4f3f4"}
              />
            </View>
          </View>

          {/* Display Options */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Display Options</Text>

            <TouchableOpacity style={[styles.settingItem, dynamicStyles.settingItem]}>
              <View style={styles.settingInfo}>
                <Ionicons name="bar-chart-outline" size={24} color={colors.text} style={styles.settingIcon} />
                <Text style={[styles.settingText, dynamicStyles.settingText]}>Default Chart Type</Text>
              </View>
              <Text style={[styles.valueText, { color: colors.textSecondary }]}>Donut</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingItem, dynamicStyles.settingItem]}>
              <View style={styles.settingInfo}>
                <Ionicons name="calendar-outline" size={24} color={colors.text} style={styles.settingIcon} />
                <Text style={[styles.settingText, dynamicStyles.settingText]}>Default Time Period</Text>
              </View>
              <Text style={[styles.valueText, { color: colors.textSecondary }]}>Month</Text>
            </TouchableOpacity>
          </View>

          {/* Data Management */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Data Management</Text>

            <TouchableOpacity style={[styles.settingItem, dynamicStyles.settingItem]}>
              <View style={styles.settingInfo}>
                <Ionicons name="refresh-outline" size={24} color={colors.text} style={styles.settingIcon} />
                <Text style={[styles.settingText, dynamicStyles.settingText]}>Sync Investment Data</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingItem, dynamicStyles.settingItem]}>
              <View style={styles.settingInfo}>
                <Ionicons name="download-outline" size={24} color={colors.text} style={styles.settingIcon} />
                <Text style={[styles.settingText, dynamicStyles.settingText]}>Export Portfolio Data</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  invisibleBackdrop: {
    flex: 1,
    backgroundColor: 'transparent', // Completely transparent backdrop
  },
  container: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
    height: '100%',
    alignSelf: 'flex-end',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  valueText: {
    fontSize: 14,
    color: '#1976d2',
  },
});

export default InvestmentSettingsDrawer;
