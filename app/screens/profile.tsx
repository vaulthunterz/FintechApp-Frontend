import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import Profile from '../components/profile/Profile';

const ProfileScreen = () => {
  const params = useLocalSearchParams();
  // Check if this is an investment portfolio or user profile
  // If source is 'user', it's explicitly a user profile
  // If source is 'investment', it's an investment portfolio
  // If source is undefined, default to user profile
  const isInvestmentPortfolio = params.source === 'investment';
  const { colors } = useTheme();

  // Add debug logging
  console.log('Profile Screen params:', params);
  console.log('isInvestmentPortfolio:', isInvestmentPortfolio);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: isInvestmentPortfolio ? 'Investment Portfolio' : 'User Profile',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />

      <Profile isInvestmentPortfolio={isInvestmentPortfolio} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ProfileScreen;