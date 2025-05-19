import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import { getAuth, User as FirebaseUser } from '@firebase/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from '@firebase/auth';
import { showSuccessToast, showErrorToast } from '../utils/toastUtils';
import { app } from '../config/firebaseConfig';

// Initialize auth with the Firebase app instance
const auth = getAuth(app);

interface User {
  uid: string;
  djangoId?: string;
  email: string | null;
  username?: string;
  date_joined?: string;
  lastTokenRefresh?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getValidToken: () => Promise<string>;
  errors: {
    general?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
}

const TOKEN_REFRESH_INTERVAL = 55 * 60 * 1000; // 55 minutes in milliseconds

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const decodedToken = JSON.parse(atob(token.split('.')[1]));
          const djangoId = decodedToken.django_id;

          setUser({
            uid: firebaseUser.uid,
            djangoId: djangoId,
            email: firebaseUser.email,
            username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            date_joined: new Date().toISOString(),
            lastTokenRefresh: Date.now()
          });
        } catch (error) {
          console.error('Error getting Django user ID:', error);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            lastTokenRefresh: Date.now()
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Setup periodic token refresh
  useEffect(() => {
    if (!user) return;

    const refreshTimer = setInterval(async () => {
      await refreshUser();
    }, TOKEN_REFRESH_INTERVAL);

    return () => clearInterval(refreshTimer);
  }, [user]);

  const getValidToken = async (): Promise<string> => {
    if (!auth.currentUser) {
      throw new Error('No user is signed in');
    }

    const now = Date.now();
    const lastRefresh = user?.lastTokenRefresh || 0;

    // Force token refresh if it's been more than 55 minutes
    if (now - lastRefresh > TOKEN_REFRESH_INTERVAL) {
      await refreshUser();
    }

    return auth.currentUser.getIdToken();
  };

  const refreshUser = async () => {
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken(true);
        setUser(prev => prev ? {
          ...prev,
          lastTokenRefresh: Date.now()
        } : null);
        console.log('Token refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      // If token refresh fails, we should log out the user
      await logout();
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      showSuccessToast('Login Successful', 'Welcome back!');
      router.replace('/');
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setLoading(true);
      setErrors({});

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error: any) {
      console.error('Register error:', error);
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

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      getValidToken,
      errors
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;