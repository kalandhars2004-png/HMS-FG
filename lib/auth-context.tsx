'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { AuthAPI } from './api';

interface AuthContextType {
  user: User | null;
  /**
   * Resolves with the signed-in user. Deliberately does NOT navigate — the caller
   * owns the redirect so it can show a welcome state first.
   */
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await AuthAPI.login(email, password);

      if (!res?.token) {
        throw new Error(res?.message || 'Login failed');
      }

      // The backend now returns `user` on login. Never default the role to 'admin' —
      // a missing role previously granted the whole admin UI by accident.
      const role = (res.user?.role ?? res.role)?.toLowerCase();
      if (!role) {
        throw new Error('Login response did not include a role');
      }

      const backendUser: User = {
        id: String(res.user?.id ?? ''),
        username: res.user?.name || email,
        email: res.user?.email || email,
        role,
      };
      localStorage.setItem('user', JSON.stringify(backendUser));
      localStorage.setItem('authToken', res.token || '');
      setUser(backendUser);
      return backendUser;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
