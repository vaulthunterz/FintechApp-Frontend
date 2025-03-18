import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface DrawerMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

const DrawerMenu: React.FC<DrawerMenuProps> = ({ isVisible, onClose }) => {
  const translateX = React.useRef(new Animated.Value(-300)).current;

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: isVisible ? 0 : -300,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);
  
  const handleNavigation = (route: string) => {
    onClose();
    router.push(route as any);
  };

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.overlayTouchable} onPress={onClose} />
      <Animated.View 
        style={[
          styles.drawerContainer,
          { transform: [{ translateX }] }
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>FinTech App</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.menuItems}>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => handleNavigation('/screens/home')}
          >
            <Ionicons name="home-outline" size={24} color="#555" />
            <Text style={styles.menuItemText}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => handleNavigation('/screens/transactions')}
          >
            <Ionicons name="list-outline" size={24} color="#555" />
            <Text style={styles.menuItemText}>Transactions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => handleNavigation('/screens/add-transaction')}
          >
            <Ionicons name="add-circle-outline" size={24} color="#555" />
            <Text style={styles.menuItemText}>Add Transaction</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => handleNavigation('/screens/model-metrics')}
          >
            <Ionicons name="analytics-outline" size={24} color="#555" />
            <Text style={styles.menuItemText}>Model Metrics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => handleNavigation('/screens/settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#555" />
            <Text style={styles.menuItemText}>Settings</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  header: {
    backgroundColor: '#1e88e5',
    paddingTop: Platform.OS === 'android' ? 8 : 8,
    paddingBottom: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#333',
  },
});

export default DrawerMenu; 