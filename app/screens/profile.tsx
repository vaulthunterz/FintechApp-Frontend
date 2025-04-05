import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import Profile from '../components/profile/Profile';

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'User Profile',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
      
      <Profile />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default ProfileScreen; 