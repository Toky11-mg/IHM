import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, UserRole, LoginCredentials } from '../types';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authApi.me()
        .then((res) => setUser(res.data.data))
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const res = await authApi.login(credentials);
    const { token } = res.data.data;
    localStorage.setItem('token', token);
    const meRes = await authApi.me();
    const userData = meRes.data.data;
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  const hasRole = (role: UserRole) => {
    return user?.roles?.includes(role) ?? false;
  };

  const isAuthenticated = () => !!user;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};