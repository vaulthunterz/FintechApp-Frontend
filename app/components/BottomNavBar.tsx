import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

interface BottomNavBarProps {
  currentRoute?: string;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentRoute }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

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

  // Create dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: colors.tabBarBackground,
      borderTopColor: colors.border,
    },
    activeNavItem: {
      borderTopColor: colors.tabBarActive,
    },
    navText: {
      color: colors.tabBarInactive,
    },
    activeNavText: {
      color: colors.tabBarActive,
    }
  };

  return (
    <View style={[
      styles.container,
      dynamicStyles.container,
      { paddingBottom: Math.max(insets.bottom, 10) }
    ]}>
      <TouchableOpacity
        style={[styles.navItem, isHomeActive && [styles.activeNavItem, dynamicStyles.activeNavItem]]}
        onPress={navigateToHome}
      >
        <Ionicons
          name="home-outline"
          size={24}
          color={isHomeActive ? colors.tabBarActive : colors.tabBarInactive}
        />
        <Text style={[styles.navText, dynamicStyles.navText, isHomeActive && [styles.activeNavText, dynamicStyles.activeNavText]]}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, isExpenseActive && [styles.activeNavItem, dynamicStyles.activeNavItem]]}
        onPress={navigateToExpenses}
      >
        <Ionicons
          name="wallet-outline"
          size={24}
          color={isExpenseActive ? colors.tabBarActive : colors.tabBarInactive}
        />
        <Text style={[styles.navText, dynamicStyles.navText, isExpenseActive && [styles.activeNavText, dynamicStyles.activeNavText]]}>
          Expenses
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, isInvestmentActive && [styles.activeNavItem, dynamicStyles.activeNavItem]]}
        onPress={navigateToInvestments}
      >
        <FontAwesome5
          name="chart-line"
          size={22}
          color={isInvestmentActive ? colors.tabBarActive : colors.tabBarInactive}
        />
        <Text style={[styles.navText, dynamicStyles.navText, isInvestmentActive && [styles.activeNavText, dynamicStyles.activeNavText]]}>
          Investments
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
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
    paddingTop: 5,
  },
  navText: {
    marginTop: 4,
    fontSize: 12,
  },
  activeNavText: {
    fontWeight: 'bold',
  },
});

export default BottomNavBar;
