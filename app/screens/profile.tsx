import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import Profile from '../components/profile/Profile';

const ProfileScreen = () => {
  const params = useLocalSearchParams();
  const isInvestmentPortfolio = params.source === 'investment';
  const { colors } = useTheme();

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