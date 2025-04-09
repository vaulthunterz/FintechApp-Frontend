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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SettingsDrawerProps {
  isVisible: boolean;
  onClose: () => void;
}

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isVisible, onClose }) => {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [darkMode, setDarkMode] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);
  const [biometricAuth, setBiometricAuth] = React.useState(false);

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

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Logout error:', error);
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
            {
              transform: [{ translateX: slideAnim }],
              paddingTop: insets.top > 0 ? insets.top : 20,
              paddingBottom: insets.bottom > 0 ? insets.bottom : 20
            }
          ]}
        >
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appearance</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon-outline" size={24} color="#555" style={styles.settingIcon} />
                <Text style={styles.settingText}>Dark Mode</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={darkMode ? "#1976d2" : "#f4f3f4"}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications-outline" size={24} color="#555" style={styles.settingIcon} />
                <Text style={styles.settingText}>Push Notifications</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={notifications ? "#1976d2" : "#f4f3f4"}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="finger-print-outline" size={24} color="#555" style={styles.settingIcon} />
                <Text style={styles.settingText}>Biometric Authentication</Text>
              </View>
              <Switch
                value={biometricAuth}
                onValueChange={setBiometricAuth}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={biometricAuth ? "#1976d2" : "#f4f3f4"}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
              <View style={styles.settingInfo}>
                <Ionicons name="log-out-outline" size={24} color="#d32f2f" style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: '#d32f2f' }]}>Logout</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#d32f2f" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="information-circle-outline" size={24} color="#555" style={styles.settingIcon} />
                <Text style={styles.settingText}>Version</Text>
              </View>
              <Text style={styles.versionText}>1.0.0</Text>
            </View>
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
  versionText: {
    fontSize: 14,
    color: '#888',
  },
});

export default SettingsDrawer;
