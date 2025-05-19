import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import 'react-native-reanimated';
import Toast, { BaseToast, ErrorToast, ToastConfig as ToastConfigType } from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { toastConfig } from './config/toastConfig';

import AuthProvider from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import BottomNavBar from './components/BottomNavBar';
import BackgroundSMSListener from './components/BackgroundSMSListener';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const currentRoute = usePathname() ?? '';
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
      <ThemeProvider>
        <SafeAreaProvider>
          <AppContent currentRoute={currentRoute} shouldShowBottomNav={shouldShowBottomNav} loaded={loaded} />
        </SafeAreaProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

// Separate component to use the theme context
function AppContent({ currentRoute, shouldShowBottomNav, loaded }: { currentRoute: string | undefined, shouldShowBottomNav: boolean, loaded: boolean }) {
  const { colors, isDark } = useTheme();
  const [initialized, setInitialized] = useState<boolean>(false);

  if (!loaded) {
    return null;
  }

  return (
    <>
      <View style={{ flex: 1, flexDirection: 'column', backgroundColor: colors.background }}>
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
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
            <Stack.Screen name="screens/profile" options={{ headerShown: false }} />
            <Stack.Screen name="screens/change-password" options={{ headerShown: false }} />
            <Stack.Screen name="screens/mpesa-history" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </View>
        {shouldShowBottomNav && <BottomNavBar currentRoute={currentRoute} />}
        <StatusBar style={isDark ? "light" : "dark"} />
        <Toast config={toastConfig} />
        {/* Only show SMS listener when user is authenticated and on Android */}
        {shouldShowBottomNav && Platform.OS === 'android' && <BackgroundSMSListener />}
      </View>
    </>
  );
}
