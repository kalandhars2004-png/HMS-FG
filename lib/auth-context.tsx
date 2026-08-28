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
        branchId: res.user?.branchId != null ? String(res.user.branchId) : null,
        branchName: res.user?.branchName ?? null,
        organizationId: res.user?.organizationId != null ? String(res.user.organizationId) : null,
      };
      localStorage.setItem('user', JSON.stringify(backendUser));
      localStorage.setItem('authToken', res.token || '');
      // Branch context: super-admin may have null; branch users get their branch auto-selected
      if (backendUser.branchId) {
        localStorage.setItem('selectedBranchId', backendUser.branchId);
      } else {
        localStorage.removeItem('selectedBranchId');
      }
      // Signing in is the definitive start of a session. Clearing here (not just
      // on logout) means the restock warning still appears when the previous
      // session ended some other way — token expiry, a 401 redirect, or a crash.
      sessionStorage.removeItem('ims.stockAlert.seen');
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
    localStorage.removeItem('selectedBranchId');
    // Per-session UI state must not leak across accounts — the next person to
    // sign in should get their own restock warning.
    sessionStorage.removeItem('ims.stockAlert.seen');
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
