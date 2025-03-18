import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function IndexScreen() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, redirect to home screen
        router.replace('/screens/home');
      } else {
        // User is not authenticated, redirect to login screen
        router.replace('/screens/login');
      }
    }
  }, [user, loading]);

  // This screen will not be visible as it immediately redirects
  return null;
}
