import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomNavBarProps {
  currentRoute?: string;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentRoute }) => {
  const insets = useSafeAreaInsets();

  const navigateToHome = () => {
    router.push('/screens/home');
  };

  const navigateToExpenses = () => {
    router.push('/screens/transactions');
  };

  const navigateToInvestments = () => {
    router.push('/(tabs)/investment');
  };

  const isHomeActive = currentRoute === '/screens/home';

  const isExpenseActive = currentRoute === '/screens/transactions' ||
                          currentRoute === '/screens/add-transaction' ||
                          currentRoute === '/screens/edit-transaction';

  const isInvestmentActive = currentRoute?.includes('investment');

  return (
    <View style={[
      styles.container,
      { paddingBottom: Math.max(insets.bottom, 10) }
    ]}>
      <TouchableOpacity
        style={[styles.navItem, isHomeActive && styles.activeNavItem]}
        onPress={navigateToHome}
      >
        <Ionicons
          name="home-outline"
          size={24}
          color={isHomeActive ? "#1976d2" : "#555"}
        />
        <Text style={[styles.navText, isHomeActive && styles.activeNavText]}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, isExpenseActive && styles.activeNavItem]}
        onPress={navigateToExpenses}
      >
        <Ionicons
          name="wallet-outline"
          size={24}
          color={isExpenseActive ? "#1976d2" : "#555"}
        />
        <Text style={[styles.navText, isExpenseActive && styles.activeNavText]}>
          Expenses
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, isInvestmentActive && styles.activeNavItem]}
        onPress={navigateToInvestments}
      >
        <FontAwesome5
          name="chart-line"
          size={22}
          color={isInvestmentActive ? "#1976d2" : "#555"}
        />
        <Text style={[styles.navText, isInvestmentActive && styles.activeNavText]}>
          Investments
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    borderTopWidth: 3,
    borderTopColor: '#1976d2',
    paddingTop: 5,
  },
  navText: {
    marginTop: 4,
    fontSize: 12,
    color: '#555',
  },
  activeNavText: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
});

export default BottomNavBar;
