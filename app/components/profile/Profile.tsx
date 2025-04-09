import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  TextInput
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../contexts/AuthContext';
import Toast from 'react-native-toast-message';
import api from '../../services/api';

interface ProfileData {
  id?: string;
  risk_tolerance: string | number;
  investment_experience: string;
  investment_timeline: string;
  investment_goals: string;
  investment_preference: string;
}

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState<ProfileData>({
    risk_tolerance: '',
    investment_experience: '',
    investment_timeline: '',
    investment_goals: '',
    investment_preference: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Make a real API call to get user profiles
        const response = await api.fetchUserProfiles();
        if (response && response.length > 0) {
          const userProfile = response[0];
          setProfile(userProfile);
          setFormData({
            risk_tolerance: userProfile.risk_tolerance || '',
            investment_experience: userProfile.investment_experience || '',
            investment_timeline: userProfile.investment_timeline || '',
            investment_goals: userProfile.investment_goals || '',
            investment_preference: userProfile.investment_preference || ''
          });
        } else {
          // No existing profile, show empty form
          console.log("No existing investment profile found");
          Toast.show({
            type: 'info',
            text1: 'Welcome!',
            text2: 'Please fill out your investment profile'
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load profile data. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (name: keyof ProfileData, value: string | number) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.risk_tolerance || !formData.investment_experience || !formData.investment_timeline) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in all required fields'
      });
      return;
    }

    setSaving(true);
    
    try {
      let updatedProfile;
      if (profile?.id) {
        // Update existing profile
        updatedProfile = await api.updateUserProfile(profile.id, formData);
      } else {
        // Create new profile
        updatedProfile = await api.createUserProfile(formData);
      }
      
      setProfile(updatedProfile);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update profile. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Profile</Text>
      
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Investment Preferences</Text>
        <View style={styles.divider} />
        
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Risk Tolerance</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.risk_tolerance}
                onValueChange={(value) => handleChange('risk_tolerance', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select risk tolerance" value="" />
                <Picker.Item label="Low" value={1} />
                <Picker.Item label="Medium" value={2} />
                <Picker.Item label="High" value={3} />
              </Picker>
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Investment Experience</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.investment_experience}
                onValueChange={(value) => handleChange('investment_experience', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select experience" value="" />
                <Picker.Item label="Beginner" value="beginner" />
                <Picker.Item label="Intermediate" value="intermediate" />
                <Picker.Item label="Advanced" value="advanced" />
              </Picker>
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Investment Timeline</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.investment_timeline}
                onValueChange={(value) => handleChange('investment_timeline', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select timeline" value="" />
                <Picker.Item label="Short-term (< 3 years)" value="short" />
                <Picker.Item label="Mid-term (3-10 years)" value="mid" />
                <Picker.Item label="Long-term (> 10 years)" value="long" />
              </Picker>
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Investment Goals</Text>
            <TextInput
              style={styles.input}
              value={formData.investment_goals?.toString()}
              onChangeText={(value) => handleChange('investment_goals', value)}
              placeholder="e.g., Retirement, Education, Home Purchase"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Investment Preferences</Text>
            <TextInput
              style={styles.input}
              value={formData.investment_preference?.toString()}
              onChangeText={(value) => handleChange('investment_preference', value)}
              placeholder="e.g., Money Market Funds, Government Bonds"
              multiline
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, saving && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={saving}
            >
              <Text style={styles.buttonText}>
                {saving ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.divider} />
        
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User ID</Text>
            <Text style={styles.infoValue}>{user?.uid || 'N/A'}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
  },
  form: {
    width: '100%',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
    color: '#555',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    ...Platform.select({
      ios: {
        marginBottom: 0,
      },
    }),
  },
  picker: {
    height: 50,
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    minHeight: 50,
  },
  buttonContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#b0bec5',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoContainer: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    width: 100,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
});

export default Profile; 