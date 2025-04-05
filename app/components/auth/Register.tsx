import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { TextInput, Button, Text } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import Toast from 'react-native-toast-message';

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const Register = () => {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Register using Firebase (adapted for the Expo app)
      await register(formData.email, formData.password);
      
      Toast.show({
        type: 'success',
        text1: 'Registration successful!',
        text2: 'Welcome to the app!'
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      // Display error message
      Toast.show({
        type: 'error',
        text1: 'Registration failed',
        text2: 'Please check your information and try again'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.card}>
          <Text style={styles.title}>Create an Account</Text>
          
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, errors.username ? styles.inputError : null]}
                placeholder="Username"
                value={formData.username}
                onChangeText={(value) => handleChange('username', value)}
              />
              {errors.username ? (
                <Text style={styles.errorText}>{errors.username}</Text>
              ) : null}
            </View>
            
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, errors.email ? styles.inputError : null]}
                placeholder="Email"
                keyboardType="email-address"
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
              />
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}
            </View>
            
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, errors.password ? styles.inputError : null]}
                placeholder="Password"
                secureTextEntry
                value={formData.password}
                onChangeText={(value) => handleChange('password', value)}
              />
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
            </View>
            
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
                placeholder="Confirm Password"
                secureTextEntry
                value={formData.confirmPassword}
                onChangeText={(value) => handleChange('confirmPassword', value)}
              />
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              ) : null}
            </View>
            
            <Button
              title={loading ? "Please wait..." : "Register"}
              onPress={handleSubmit}
              disabled={loading}
              color="#1976d2"
            />
            
            {loading && (
              <ActivityIndicator 
                size="small" 
                color="#1976d2" 
                style={styles.spinner} 
              />
            )}
            
            <View style={styles.loginLink}>
              <Text style={styles.linkText}>
                Already have an account?{' '}
                <Link href="/screens/login" style={styles.link}>
                  Sign in
                </Link>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  spinner: {
    marginTop: 10,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 15,
  },
  linkText: {
    fontSize: 14,
    color: '#666',
  },
  link: {
    color: '#1976d2',
    textDecorationLine: 'underline',
  },
});

export default Register; 