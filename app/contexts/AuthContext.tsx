import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { showSuccessToast, showErrorToast } from '../utils/toastUtils';

interface User {
  uid: string;  // Firebase UID
  djangoId?: string;  // Django user ID
  email: string | null;
  username?: string;
  date_joined?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<any>; // Return UserCredential
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  errors: {
    general?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<AuthContextType['errors']>({});

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Get the Django user ID from the token
          const token = await firebaseUser.getIdToken();
          const decodedToken = JSON.parse(atob(token.split('.')[1]));
          const djangoId = decodedToken.django_id; // This will be added by your backend

          setUser({
            uid: firebaseUser.uid,
            djangoId: djangoId,
            email: firebaseUser.email,
            username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            date_joined: new Date().toISOString() // Placeholder, should come from backend
          });
        } catch (error) {
          console.error('Error getting Django user ID:', error);
          // Fallback to just Firebase UID
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      showSuccessToast('Login Successful', 'Welcome back!');
      router.replace('/');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setLoading(true);
      setErrors({}); // Clear any previous errors

      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Don't navigate immediately - let the calling component handle navigation
      // after any additional profile setup

      return userCredential; // Return the user credential for further processing
    } catch (error: any) {
      console.error('Register error:', error);
      // Check specifically for email-already-in-use error
      if (error.code === 'auth/email-already-in-use') {
        setErrors({
          email: 'This email is already registered',
          general: 'Please use a different email or try logging in'
        });
        throw new Error('This email is already registered. Please use a different email or try logging in.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      showSuccessToast('Logged Out', 'You have been successfully logged out');
      router.replace('/screens/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      showErrorToast('Logout Failed', error.message || 'Failed to log out');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken(true);
        // Normally you would refresh user data from your backend here
        console.log('Token refreshed');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, errors }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;