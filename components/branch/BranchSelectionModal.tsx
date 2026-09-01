'use client';

import { useState, useEffect, useMemo } from 'react';
import { Building2, Check, X, Search, Store, Warehouse, Layers } from '@/components/ui/LucideIcon';
import GlobalModal from '@/components/ui/GlobalModal';
import { useBranch } from '@/lib/branch-context';

interface Props {
  open: boolean;
  onClose?: () => void;
  allowCancel?: boolean;
}

export default function BranchSelectionModal({ open, onClose, allowCancel = false }: Props) {
  const { branches, selectedBranchId, selectBranch, isSuperAdmin } = useBranch();
  const [draftId, setDraftId] = useState<string>(selectedBranchId || '');
  const [query, setQuery] = useState('');

  useEffect(() => {
    setDraftId(selectedBranchId || '');
  }, [selectedBranchId, open]);

  useEffect(() => { if (open) setQuery(''); }, [open]);

  const activeBranches = branches.filter(b => b.status === 'ACTIVE');
  const filtered = useMemo(() => {
    if (!open || !isSuperAdmin) return [];
    const q = query.toLowerCase().trim();
    if (!q) return activeBranches;
    return activeBranches.filter(b => `${b.name} ${b.code} ${b.city ?? ''} ${b.type}`.toLowerCase().includes(q));
  }, [open, isSuperAdmin, activeBranches, query]);
  const canContinue = !!draftId;

  if (!isSuperAdmin) return null;
  if (!open) return null;

  const handleContinue = () => {
    if (!draftId) return;
    selectBranch(draftId);
    onClose?.();
  };

  return (
    <GlobalModal
      open={open}
      onClose={() => { if (allowCancel) onClose?.(); }}
      hideFooter
      size="md"
      title="Select Branch"
      subtitle="Please select a branch to continue."
      icon={<Building2 className="w-4 h-4" />}
      iconTileClass="bg-gradient-to-br from-[#0F9291] to-teal-600"
      closeOnEscape={allowCancel}
      onBackdropClose={allowCancel}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Select Branch <span className="text-red-500">*</span>
          </label>
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, code, city..."
              className="w-full h-10 pl-9 pr-9 bg-white dark:bg-[#141B2E] border border-gray-200 dark:border-[#2A2A2A] rounded-xl text-sm focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/10"
            />
            <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <div className="max-h-[280px] overflow-y-auto rounded-xl border border-gray-100 dark:border-[#273244] divide-y divide-gray-50 dark:divide-[#273244]">
            {filtered.map((b) => {
              const active = String(b.id) === draftId;
              const Icon = b.type === 'CENTRAL_WAREHOUSE' ? Warehouse : b.type === 'WAREHOUSE' ? Store : Building2;
              return (
                <button
                  key={String(b.id)}
                  onClick={() => setDraftId(String(b.id))}
                  className={`w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors ${active ? 'bg-[#0F9291]/10' : ''}`}
                >
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-[#0F9291] text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}><Icon className="w-4 h-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm truncate ${active ? 'font-semibold text-[#0F9291]' : 'font-medium text-gray-900 dark:text-white'}`}>{b.name}</span>
                    <span className="block text-xs text-gray-500 truncate">{b.code} {b.city ? `· ${b.city}` : ''} <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${b.type === 'RETAIL' ? 'bg-sky-50 text-sky-700' : b.type === 'WAREHOUSE' ? 'bg-amber-50 text-amber-700' : 'bg-violet-50 text-violet-700'}`}>{b.type}</span></span>
                  </span>
                  {active ? <span className="w-7 h-7 rounded-full bg-[#0F9291] text-white flex items-center justify-center shrink-0"><Check className="w-4 h-4" /></span> : <span className="w-7 h-7 rounded-full border border-gray-200 dark:border-[#2A2A2A] shrink-0" />}
                </button>
              );
            })}
            {filtered.length === 0 && <p className="px-3 py-8 text-center text-sm text-gray-400">No branches match “{query}”</p>}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Branch context will persist while navigating. Switch anytime via header <span className="inline-flex items-center gap-1"><Layers className="w-3 h-3" /> Current Branch</span>.</p>
        </div>

        {activeBranches.length === 0 && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">No active branches found. Create a branch first.</p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          {allowCancel && (
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#232323] hover:bg-gray-200 dark:hover:bg-[#2A2A2A] transition-all"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          )}
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#0F9291] to-teal-600 shadow-sm shadow-[#0F9291]/30 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <Check className="w-4 h-4" /> Continue
          </button>
        </div>
      </div>
    </GlobalModal>
  );
}
