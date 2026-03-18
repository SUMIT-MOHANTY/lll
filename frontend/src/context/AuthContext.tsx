import React, { createContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { post } from '../services/api';
import { AuthState, User, LoginRequest, LoginResponse } from '../types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

export const AuthContext = createContext<AuthContextType>({
  ...initialState,
  login: async () => {},
  logout: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, setState] = useState<AuthState>(initialState);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          setState({
            user: JSON.parse(storedUser),
            token: storedToken,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
        } else {
          setState({ ...initialState, loading: false });
        }
      } catch (error) {
        console.error('Failed to initialize auth state:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setState({ ...initialState, loading: false });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setState({ ...state, loading: true, error: null });

      const response = await post<LoginResponse>('/auth/login', credentials);
      const { token, user } = response;

      // Store auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setState({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Login failed:', error);
      setState({
        ...state,
        loading: false,
        error: 'Authentication failed. Please check your credentials and try again.',
      });
      throw error;
    }
  }, [state]);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
