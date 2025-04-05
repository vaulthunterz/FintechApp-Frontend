import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the tabs home which has the automatic auth check
  return <Redirect href="/(tabs)" />;
} 