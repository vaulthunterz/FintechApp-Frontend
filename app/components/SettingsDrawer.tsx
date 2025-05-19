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
  Modal,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { showErrorToast } from '../utils/toastUtils';

interface SettingsDrawerProps {
  isVisible: boolean;
  onClose: () => void;
}

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isVisible, onClose }) => {
  const { logout } = useAuth();
  const { isDark, toggleTheme, theme, setTheme } = useTheme();
  const insets = useSafeAreaInsets();
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
    } catch (error: any) {
      console.error('Logout error:', error);
      showErrorToast('Logout Error', error.message || 'Failed to log out');
    }
  };

  // Get theme colors
  const { colors } = useTheme();

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
          <Text style={[styles.title, dynamicStyles.title]}>Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Appearance</Text>

            <View style={[styles.settingItem, dynamicStyles.settingItem]}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon-outline" size={24} color={colors.text} style={styles.settingIcon} />
                <Text style={[styles.settingText, dynamicStyles.settingText]}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={isDark ? "#1976d2" : "#f4f3f4"}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Notifications</Text>

            <View style={[styles.settingItem, dynamicStyles.settingItem]}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications-outline" size={24} color={colors.text} style={styles.settingIcon} />
                <Text style={[styles.settingText, dynamicStyles.settingText]}>Push Notifications</Text>
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
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Account</Text>

            <TouchableOpacity
              style={[styles.settingItem, dynamicStyles.settingItem]}
              onPress={() => {
                onClose();
                // Explicitly set source to 'user' to ensure we get the user profile
                router.push({
                  pathname: '/screens/profile',
                  params: { source: 'user' }
                });
              }}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="person-outline" size={24} color={colors.text} style={styles.settingIcon} />
                <Text style={[styles.settingText, dynamicStyles.settingText]}>User Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Only show M-PESA History option on Android */}
            {Platform.OS === 'android' && (
              <TouchableOpacity
                style={[styles.settingItem, dynamicStyles.settingItem]}
                onPress={() => {
                  onClose();
                  router.push('/screens/mpesa-history');
                }}
              >
                <View style={styles.settingInfo}>
                  <Ionicons name="phone-portrait-outline" size={24} color={colors.text} style={styles.settingIcon} />
                  <Text style={[styles.settingText, dynamicStyles.settingText]}>M-PESA History</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.settingItem, dynamicStyles.settingItem]}
              onPress={() => {
                onClose();
                router.push('/screens/change-password');
              }}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="key-outline" size={24} color={colors.text} style={styles.settingIcon} />
                <Text style={[styles.settingText, dynamicStyles.settingText]}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, dynamicStyles.settingItem]}
              onPress={() => {
                // Show confirmation dialog before deleting account
                Alert.alert(
                  'Delete Account',
                  'Are you sure you want to delete your account? This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        // Implement account deletion logic here
                        Toast.show({
                          type: 'info',
                          text1: 'Feature Coming Soon',
                          text2: 'Account deletion will be available in a future update.'
                        });
                      }
                    }
                  ]
                );
              }}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="trash-outline" size={24} color={colors.error} style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: colors.error }]}>Delete Account</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.error} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingItem, dynamicStyles.settingItem]} onPress={handleLogout}>
              <View style={styles.settingInfo}>
                <Ionicons name="log-out-outline" size={24} color={colors.error} style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: colors.error }]}>Logout</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>About</Text>

            <View style={[styles.settingItem, dynamicStyles.settingItem]}>
              <View style={styles.settingInfo}>
                <Ionicons name="information-circle-outline" size={24} color={colors.text} style={styles.settingIcon} />
                <Text style={[styles.settingText, dynamicStyles.settingText]}>Version</Text>
              </View>
              <Text style={[styles.versionText, dynamicStyles.versionText]}>1.0.0</Text>
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
