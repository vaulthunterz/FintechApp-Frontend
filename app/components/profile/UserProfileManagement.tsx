import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { auth } from '../../config/firebaseConfig';

const UserProfileManagement: React.FC = () => {
  const { user, signOut } = useAuth();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    displayName: '',
    email: '',
    username: '',
    date_joined: new Date(),
    last_login: new Date(),
    uid: ''
  });

  // Use Firebase user data directly from AuthContext
  useEffect(() => {
    const setUserDataFromFirebase = async () => {
      try {
        setLoading(true);
        console.log('Setting user data from Firebase...');

        if (user) {
          // Get metadata from Firebase auth if available
          const firebaseUser = auth.currentUser;
          const metadata = firebaseUser?.metadata;

          // Parse creation time and last sign-in time
          const creationTime = metadata?.creationTime ? new Date(metadata.creationTime) : new Date();
          const lastSignInTime = metadata?.lastSignInTime ? new Date(metadata.lastSignInTime) : new Date();

          // Use email from Firebase auth
          const email = user.email || '';

          // Use username derived from email (remove domain part)
          const username = email ? email.split('@')[0] : '';

          setUserData({
            displayName: username, // No display name set during registration
            email: email,
            username: username,
            date_joined: creationTime,
            last_login: lastSignInTime,
            uid: user.uid || 'N/A'
          });

          console.log('User data set from Firebase:', {
            email,
            username,
            uid: user.uid,
            creationTime,
            lastSignInTime
          });
        } else {
          console.log('No authenticated user found');
          // Redirect to login if no user
          router.replace('/screens/login');
        }
      } catch (error) {
        console.error('Error setting user data from Firebase:', error);
      } finally {
        setLoading(false);
      }
    };

    setUserDataFromFirebase();
  }, [user]);

  // Create dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: colors.background,
    },
    title: {
      color: colors.text,
    },
    card: {
      backgroundColor: colors.card,
      shadowColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)',
    },
    sectionTitle: {
      color: colors.text,
    },
    divider: {
      backgroundColor: colors.border,
    },
    label: {
      color: colors.textSecondary,
    },
    input: {
      color: colors.text,
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
    },
    infoLabel: {
      color: colors.textSecondary,
    },
    infoValue: {
      color: colors.text,
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    dangerButton: {
      backgroundColor: colors.error,
    },
    accountButtonText: {
      color: '#fff',
    },
    debugText: {
      color: colors.textSecondary,
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleChangePassword = () => {
    router.push('/screens/change-password');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              // Call API to delete account
              await api.deleteUserAccount();

              // Sign out the user
              await signOut();

              // Navigate to login screen
              router.replace('/screens/login');

              Toast.show({
                type: 'success',
                text1: 'Account Deleted',
                text2: 'Your account has been successfully deleted',
                position: 'bottom'
              });
            } catch (error) {
              console.error('Error deleting account:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete account. Please try again.',
                position: 'bottom'
              });
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/screens/login');
    } catch (error) {
      console.error('Error signing out:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to sign out. Please try again.',
        position: 'bottom'
      });
    }
  };

  return (
    <ScrollView style={[styles.container, dynamicStyles.container]}>
      <Text style={[styles.title, dynamicStyles.title]}>User Profile</Text>

      <View style={[styles.card, dynamicStyles.card]}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Personal Information</Text>
        <View style={[styles.divider, dynamicStyles.divider]} />

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>Name</Text>
            <Text style={[styles.infoValue, dynamicStyles.infoValue]}>{userData.displayName || 'Not set'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>Username</Text>
            <Text style={[styles.infoValue, dynamicStyles.infoValue]}>{userData.username || 'Not set'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>Email</Text>
            <Text style={[styles.infoValue, dynamicStyles.infoValue]}>{userData.email || 'Not set'}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, dynamicStyles.card]}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Account Information</Text>
        <View style={[styles.divider, dynamicStyles.divider]} />

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>Account Created</Text>
            <Text style={[styles.infoValue, dynamicStyles.infoValue]}>{formatDate(userData.date_joined)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>Last Sign In</Text>
            <Text style={[styles.infoValue, dynamicStyles.infoValue]}>{formatDate(userData.last_login)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>User ID</Text>
            <Text style={[styles.infoValue, dynamicStyles.infoValue]}>{userData.uid || 'N/A'}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, dynamicStyles.card]}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Account Management</Text>
        <View style={[styles.divider, dynamicStyles.divider]} />

        <TouchableOpacity
          style={[styles.accountButton, dynamicStyles.primaryButton]}
          onPress={handleChangePassword}
        >
          <Text style={[styles.accountButtonText, dynamicStyles.accountButtonText]}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.accountButton, dynamicStyles.primaryButton]}
          onPress={() => router.push('/screens/investment-questionnaire')}
        >
          <Text style={[styles.accountButtonText, dynamicStyles.accountButtonText]}>Update Investment Questionnaire</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.accountButton, dynamicStyles.primaryButton]}
          onPress={handleSignOut}
        >
          <Text style={[styles.accountButtonText, dynamicStyles.accountButtonText]}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.accountButton, dynamicStyles.dangerButton]}
          onPress={handleDeleteAccount}
        >
          <Text style={[styles.accountButtonText, dynamicStyles.accountButtonText]}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  infoContainer: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  accountButton: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  accountButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default UserProfileManagement;
