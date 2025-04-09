import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import AuthProvider from './contexts/AuthContext';
import BottomNavBar from './components/BottomNavBar';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const currentRoute = usePathname();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // Hide bottom nav on login, register screens
  const shouldShowBottomNav = !currentRoute?.includes('login') &&
                              !currentRoute?.includes('register');

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <View style={{ flex: 1, flexDirection: 'column' }}>
            <View style={{ flex: 1 }}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="screens/login" options={{ headerShown: false }} />
                <Stack.Screen name="screens/register" options={{ headerShown: false }} />
                <Stack.Screen name="screens/home" options={{ headerShown: false }} />
                <Stack.Screen name="screens/transactions" options={{ headerShown: false }} />
                <Stack.Screen name="screens/add-transaction" options={{ headerShown: false }} />
                <Stack.Screen name="screens/edit-transaction" options={{ headerShown: false }} />
                <Stack.Screen name="screens/model-metrics" options={{ headerShown: false }} />
                {/* Settings screen removed - now using a sliding drawer */}
                <Stack.Screen name="screens/investment-questionnaire" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
            </View>
            {shouldShowBottomNav && <BottomNavBar currentRoute={currentRoute} />}
            <StatusBar style="auto" />
            <Toast />
          </View>
        </ThemeProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
