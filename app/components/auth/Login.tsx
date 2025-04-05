import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { TextInput, Button, Text } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import Toast from 'react-native-toast-message';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const Login = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
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
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
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
      await login(formData.email, formData.password);
      
      Toast.show({
        type: 'success',
        text1: 'Login successful!',
        text2: 'Welcome back!'
      });
      
      // Navigation is handled in the login function in AuthContext
    } catch (error) {
      console.error('Login error:', error);
      
      setErrors({
        general: 'Invalid email or password'
      });
      
      Toast.show({
        type: 'error',
        text1: 'Login failed',
        text2: 'Please check your credentials and try again'
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
          <Text style={styles.title}>Sign In</Text>
          
          {errors.general ? (
            <View style={styles.errorContainer}>
              <Text style={styles.generalError}>{errors.general}</Text>
            </View>
          ) : null}
          
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, errors.email ? styles.inputError : null]}
                placeholder="Email"
                keyboardType="email-address"
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
                autoCapitalize="none"
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
            
            <Button
              title={loading ? "Please wait..." : "Sign In"}
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
            
            <View style={styles.registerLink}>
              <Text style={styles.linkText}>
                Don't have an account?{' '}
                <Link href="/screens/register" style={styles.link}>
                  Sign up
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
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  generalError: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 10,
  },
  registerLink: {
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

export default Login; 