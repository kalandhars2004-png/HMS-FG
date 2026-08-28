'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Branch } from '@/types';
import { BranchesAPI } from './api';
import { useAuth } from './auth-context';

interface BranchContextType {
  branches: Branch[];
  selectedBranchId: string | null;
  selectedBranch: Branch | null;
  isSuperAdmin: boolean;
  isLoading: boolean;
  selectBranch: (branchId: string | null) => void;
  refresh: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isSuperAdmin = (() => {
    const r = (user?.role || '').toLowerCase();
    return r === 'super_admin' || r === 'admin';
  })();

  const load = useCallback(async () => {
    if (!user) {
      setBranches([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const res = await BranchesAPI.getAll();
      const list: Branch[] = (res.data || []).map((b: any) => ({
        ...b,
        id: String(b.id),
        organizationId: b.organizationId != null ? String(b.organizationId) : null,
        managerId: b.managerId != null ? String(b.managerId) : null,
      }));
      setBranches(list);

      // Restore selection
      const stored = typeof window !== 'undefined' ? localStorage.getItem('selectedBranchId') : null;
      if (isSuperAdmin) {
        // Super admin: null means All Branches
        if (stored && list.some(b => String(b.id) === stored)) {
          setSelectedBranchId(stored);
        } else {
          setSelectedBranchId(null);
        }
      } else {
        // Branch user: force own branch
        const own = user.branchId ? String(user.branchId) : null;
        if (own && list.some(b => b.id === own)) {
          setSelectedBranchId(own);
          localStorage.setItem('selectedBranchId', own);
        } else if (list.length > 0) {
          // fallback to first active branch if user has no branch (migrated data)
          const first = list.find(b => b.status === 'ACTIVE') || list[0];
          setSelectedBranchId(String(first.id));
          localStorage.setItem('selectedBranchId', String(first.id));
        }
      }
    } catch {
      // Branch endpoint may 403 for non-admins before RBAC is fully open; keep empty
      setBranches([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, isSuperAdmin]);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('selectedBranchId') : null;
    if (stored) setSelectedBranchId(stored);
    load();
  }, [load]);

  const selectBranch = (branchId: string | null) => {
    if (!isSuperAdmin && user?.branchId) {
      // Non-super-admin cannot switch
      return;
    }
    setSelectedBranchId(branchId);
    if (branchId) localStorage.setItem('selectedBranchId', branchId);
    else localStorage.removeItem('selectedBranchId');
    // Notify dashboard etc to refetch
    window.dispatchEvent(new CustomEvent('ims:branch-changed', { detail: { branchId } }));
  };

  const selectedBranch = selectedBranchId ? branches.find(b => b.id === selectedBranchId) || null : null;

  return (
    <BranchContext.Provider value={{ branches, selectedBranchId, selectedBranch, isSuperAdmin, isLoading, selectBranch, refresh: load }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch must be used within BranchProvider');
  return ctx;
}
