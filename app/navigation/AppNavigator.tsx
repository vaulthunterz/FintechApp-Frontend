import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Icon } from '@rneui/themed';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// Import screens
import HomeScreen from '../screens/home';
import LoginScreen from '../screens/login';
import RegisterScreen from '../screens/register';
import ProfileScreen from '../screens/profile';
import TransactionsScreen from '../screens/transactions';
import AddTransactionScreen from '../screens/add-transaction';
import EditTransactionScreen from '../screens/edit-transaction';
import MPESAHistoryScreen from '../screens/mpesa-history';
import InvestmentQuestionnaireScreen from '../screens/investment-questionnaire';
import InvestmentDashboard from '../screens/fixed-investment-dashboard';
import SettingsScreen from '../screens/settings';
import ModelMetricsScreen from '../screens/model-metrics';

// Import components

// Create navigators
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();
const HomeStack = createStackNavigator();
const ExpenseStack = createStackNavigator();
const InvestmentStack = createStackNavigator();

// Auth Navigator
const AuthNavigator = () => {
  const { colors } = useTheme();

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

// Home Stack Navigator
const HomeStackNavigator = () => {
  const { colors } = useTheme();

  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Profile" component={ProfileScreen} />
      <HomeStack.Screen
        name="TransactionDetails"
        component={EditTransactionScreen}
        options={{ title: 'Transaction Details' }}
      />
      <HomeStack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{ title: 'Add Transaction' }}
      />
    </HomeStack.Navigator>
  );
};

// Expense Stack Navigator
const ExpenseStackNavigator = () => {
  const { colors } = useTheme();

  return (
    <ExpenseStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <ExpenseStack.Screen
        name="ExpenseCategory"
        component={TransactionsScreen}
        options={{ title: 'Expense Categories' }}
      />
      <ExpenseStack.Screen
        name="MPESAScanner"
        component={MPESAHistoryScreen}
        options={{ title: 'M-PESA Scanner' }}
      />
      <ExpenseStack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{ title: 'Add Transaction' }}
      />
    </ExpenseStack.Navigator>
  );
};

// Investment Stack Navigator
const InvestmentStackNavigator = () => {
  const { colors } = useTheme();

  return (
    <InvestmentStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <InvestmentStack.Screen
        name="Investment"
        component={InvestmentDashboard}
        options={{ title: 'Investment Dashboard' }}
      />
      <InvestmentStack.Screen
        name="Questionnaire"
        component={InvestmentQuestionnaireScreen}
        options={{ title: 'Investment Questionnaire' }}
      />
      <InvestmentStack.Screen
        name="Portfolio"
        component={ProfileScreen}
        options={{ title: 'Your Portfolio' }}
      />
    </InvestmentStack.Navigator>
  );
};

// Main Tab Navigator
const TabNavigator = () => {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 10,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ExpenseTab"
        component={ExpenseStackNavigator}
        options={{
          tabBarLabel: 'Expenses',
          tabBarIcon: ({ color, size }) => (
            <Icon name="attach-money" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="InvestmentTab"
        component={InvestmentStackNavigator}
        options={{
          tabBarLabel: 'Investments',
          tabBarIcon: ({ color, size }) => (
            <Icon name="trending-up" type="material" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { isAuthenticated, loading, checkAuth } = useAuth();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    checkAuth();
  }, []);

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
