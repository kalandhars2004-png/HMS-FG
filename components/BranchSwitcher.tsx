'use client';

import { useBranch } from '@/lib/branch-context';
import { ChevronDown, Building2, Store, Warehouse } from '@/components/ui/LucideIcon';

export default function BranchSwitcher() {
  const { branches, selectedBranchId, selectedBranch, isSuperAdmin, selectBranch } = useBranch();

  if (branches.length === 0) return null;

  // Non-super-admin sees fixed branch
  if (!isSuperAdmin) {
    const b = selectedBranch;
    if (!b) return null;
    const Icon = b.type === 'CENTRAL_WAREHOUSE' ? Warehouse : b.type === 'WAREHOUSE' ? Store : Building2;
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#041A19] border border-[#0A3B38] text-[#F4F7F7]">
        <span className="w-8 h-8 rounded-lg bg-[#0F9291] flex items-center justify-center"><Icon className="w-4 h-4 text-white" /></span>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{b.name}</p>
          <p className="text-xs text-white/60 truncate">{b.code} · {b.type}</p>
        </div>
      </div>
    );
  }

  // Super admin: selector
  return (
    <div className="relative">
      <select
        value={selectedBranchId ?? ''}
        onChange={(e) => selectBranch(e.target.value || null)}
        className="w-full h-10 pl-3 pr-9 bg-[#041A19] border border-[#0A3B38] text-[#F4F7F7] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0F9291]/30 appearance-none"
      >
        <option value="">All Branches</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name} ({b.code}) {b.type !== 'RETAIL' ? `· ${b.type}` : ''} {b.status !== 'ACTIVE' ? `· ${b.status}` : ''}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />
    </div>
  );
}
