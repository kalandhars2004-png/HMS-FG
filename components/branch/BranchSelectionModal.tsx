'use client';

import { useState, useEffect } from 'react';
import { Building2, Check, X } from '@/components/ui/LucideIcon';
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

  useEffect(() => {
    setDraftId(selectedBranchId || '');
  }, [selectedBranchId, open]);

  if (!isSuperAdmin) return null;
  if (!open) return null;

  const activeBranches = branches.filter(b => b.status === 'ACTIVE');
  const canContinue = !!draftId;

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
          <div className="relative">
            <select
              value={draftId}
              onChange={(e) => setDraftId(e.target.value)}
              className="w-full h-11 pl-3 pr-9 bg-white dark:bg-[#141B2E] border border-gray-200 dark:border-[#2A2A2A] rounded-xl text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#0F9291] focus:ring-[3px] focus:ring-[#0F9291]/10 appearance-none"
            >
              <option value="">Select Branch</option>
              {activeBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.code ? `(${b.code})` : ''} {b.city ? `· ${b.city}` : ''}
                </option>
              ))}
            </select>
            <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Branch context will persist while navigating between modules. Switch anytime via header.</p>
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
