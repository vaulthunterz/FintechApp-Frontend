import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define theme types
export type ThemeType = 'light' | 'dark' | 'system';

// Define colors for each theme
export const lightTheme = {
  background: '#F8F9FA', // Very light gray with blue tint
  card: '#FFFFFF', // White for cards
  text: '#212529', // Very dark gray for text
  textSecondary: '#6C757D', // Medium gray for secondary text
  primary: '#0D6EFD', // Bright blue as primary color
  secondary: '#198754', // Green as secondary color
  accent: '#FD7E14', // Orange as accent
  border: '#DEE2E6', // Light gray for borders
  error: '#DC3545', // Red for errors
  success: '#28A745', // Green for success
  warning: '#FFC107', // Yellow for warnings
  info: '#17A2B8', // Teal for info
  headerBackground: '#0D6EFD', // Primary color for header
  headerText: '#FFFFFF', // White for header text
  tabBarBackground: '#FFFFFF', // White for tab bar
  tabBarActive: '#0D6EFD', // Primary color for active tabs
  tabBarInactive: '#6C757D', // Secondary text color for inactive tabs
  chartColors: ['#0D6EFD', '#198754', '#FD7E14', '#DC3545', '#17A2B8'],
};

export const darkTheme = {
  background: '#1A1D24', // Darker blue-gray background for better contrast
  card: '#2D3239', // Darker gray with slight blue tint for cards
  text: '#FFFFFF', // White text for better visibility in dark mode
  textSecondary: '#E0E0E0', // Light gray for secondary text
  primary: '#4ECCA3', // Mint green as primary color
  secondary: '#76ABAE', // Soft teal as secondary color
  accent: '#FFD369', // Soft yellow as accent
  border: '#3A4049', // Visible border color for dark mode
  error: '#FF6B6B', // Softer red for errors
  success: '#6BCB77', // Softer green for success
  warning: '#FFD166', // Softer yellow for warnings
  info: '#4FC4F7', // Softer blue for info
  headerBackground: '#252A32', // Slightly darker than card for header
  headerText: '#FFFFFF', // White for header text
  tabBarBackground: '#252A32', // Slightly darker than card for tab bar
  tabBarActive: '#4ECCA3', // Primary color for active tabs
  tabBarInactive: '#CCCCCC', // Lighter color for inactive tabs
  chartColors: ['#4ECCA3', '#76ABAE', '#FFD369', '#FF6B6B', '#4FC4F7'],
};

// Define the context type
interface ThemeContextType {
  theme: ThemeType;
  colors: typeof lightTheme;
  isDark: boolean;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
}

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  colors: lightTheme,
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

// Create a provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get the device color scheme
  const deviceColorScheme = useColorScheme();

  // Initialize with a default theme
  const [theme, setThemeState] = useState<ThemeType>('system');

  // Determine if we're using dark mode
  const isDark = theme === 'dark' || (theme === 'system' && deviceColorScheme === 'dark');

  // Get the appropriate color set
  const colors = isDark ? darkTheme : lightTheme;

  // Load the saved theme on initial render
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@theme');
        if (savedTheme) {
          setThemeState(savedTheme as ThemeType);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };

    loadTheme();
  }, []);

  // Save the theme whenever it changes
  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem('@theme', theme);
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
    };

    saveTheme();
  }, [theme]);

  // Function to set the theme
  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  // Function to toggle between light and dark
  const toggleTheme = () => {
    if (theme === 'light') {
      setThemeState('dark');
    } else if (theme === 'dark') {
      setThemeState('light');
    } else {
      // If system, toggle to the opposite of the system
      setThemeState(deviceColorScheme === 'dark' ? 'light' : 'dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, colors, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Create a custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);
