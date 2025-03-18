import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header";
import DrawerMenu from "../components/DrawerMenu";
import Toast from "react-native-toast-message";

const SettingsScreen = () => {
  const { logout } = useAuth();
  const [darkMode, setDarkMode] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);
  const [drawerVisible, setDrawerVisible] = React.useState(false);

  const toggleDrawer = () => {
    setDrawerVisible(!drawerVisible);
  };

  const handleLogout = async () => {
    try {
      await logout();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to logout",
      });
    }
  };

  return (
    <View style={styles.container}>
      <Header showBackButton={true} showSettingsIcon={false} isRootScreen={true} onMenuPress={toggleDrawer} />
      <DrawerMenu isVisible={drawerVisible} onClose={toggleDrawer} />

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="moon-outline" size={24} color="#555" style={styles.settingIcon} />
            <Text style={styles.settingText}>Dark Mode</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: "#d1d1d1", true: "#81b0ff" }}
            thumbColor={darkMode ? "#1e88e5" : "#f4f3f4"}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications-outline" size={24} color="#555" style={styles.settingIcon} />
            <Text style={styles.settingText}>Notifications</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: "#d1d1d1", true: "#81b0ff" }}
            thumbColor={notifications ? "#1e88e5" : "#f4f3f4"}
          />
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={() => {}}>
          <View style={styles.settingInfo}>
            <Ionicons name="person-outline" size={24} color="#555" style={styles.settingIcon} />
            <Text style={styles.settingText}>Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#aaa" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} onPress={() => {}}>
          <View style={styles.settingInfo}>
            <Ionicons name="lock-closed-outline" size={24} color="#555" style={styles.settingIcon} />
            <Text style={styles.settingText}>Change Password</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#aaa" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>About</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={() => {}}>
          <View style={styles.settingInfo}>
            <Ionicons name="information-circle-outline" size={24} color="#555" style={styles.settingIcon} />
            <Text style={styles.settingText}>App Info</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#aaa" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} onPress={() => {}}>
          <View style={styles.settingInfo}>
            <Ionicons name="help-circle-outline" size={24} color="#555" style={styles.settingIcon} />
            <Text style={styles.settingText}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#fff" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    marginRight: 15,
  },
  settingText: {
    fontSize: 16,
    color: "#333",
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e53935",
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
    marginBottom: 30,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});

export default SettingsScreen; 