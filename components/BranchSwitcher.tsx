'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useBranch } from '@/lib/branch-context';
import { ChevronDown, Building2, Store, Warehouse, Search, Check, X, Layers } from '@/components/ui/LucideIcon';

function BranchIcon({ type, active }: { type?: string; active?: boolean }) {
  const Icon = type === 'CENTRAL_WAREHOUSE' ? Warehouse : type === 'WAREHOUSE' ? Store : Building2;
  return (
    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-[#0F9291] text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'}`}>
      <Icon className="w-4 h-4" />
    </span>
  );
}

export default function BranchSwitcher() {
  const { branches, selectedBranchId, selectedBranch, isSuperAdmin, selectBranch } = useBranch();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const activeBranches = useMemo(() => branches.filter(b => b.status === 'ACTIVE'), [branches]);
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return activeBranches;
    return activeBranches.filter(b => `${b.name} ${b.code} ${b.city ?? ''} ${b.type}`.toLowerCase().includes(q));
  }, [activeBranches, query]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onEsc); };
  }, []);

  if (branches.length === 0) return null;

  // Non-super-admin: fixed pill
  if (!isSuperAdmin) {
    const b = selectedBranch;
    if (!b) return null;
    return (
      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-br from-[#041A19] to-[#0A2E2D] border border-[#0A3B38] text-[#F4F7F7] shadow-sm">
        <BranchIcon type={b.type} active />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate leading-none">{b.name}</p>
          <p className="text-[11px] text-white/60 truncate flex items-center gap-1 mt-0.5"><Layers className="w-3 h-3" />{b.code} · {b.type}</p>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Active" />
      </div>
    );
  }

  const selected = selectedBranch;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#041A19] border border-[#0A3B38] hover:border-[#0F9291]/40 text-[#F4F7F7] shadow-sm hover:shadow-md transition-all text-left"
      >
        {selected ? <BranchIcon type={selected.type} active /> : <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Layers className="w-4 h-4 text-white/60" /></span>}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate leading-none">{selected ? selected.name : 'All Branches'}</p>
          <p className="text-[11px] text-white/60 truncate">{selected ? `${selected.code} · ${selected.type}` : 'Global view — all branches'}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/60 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-40 left-0 right-0 top-full pt-2">
          <div className="rounded-2xl border border-gray-200 dark:border-[#273244] bg-white dark:bg-[#0F1525] shadow-xl shadow-black/10 overflow-hidden animate-slideDown">
          <div className="p-2.5 border-b border-gray-100 dark:border-[#273244] space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search branch, code, city..."
                className="w-full h-9 pl-9 pr-8 text-sm bg-gray-50 dark:bg-[#1A2232] border border-gray-200 dark:border-[#273244] rounded-xl focus:outline-none focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/10"
              />
              {query && <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{filtered.length} branches</p>
              {selectedBranchId && <button onClick={() => { selectBranch(null); setOpen(false); }} className="text-xs font-medium text-[#0F9291] hover:underline">Clear → All</button>}
            </div>
          </div>

          <div className="max-h-[280px] overflow-y-auto p-1.5 space-y-0.5">
            <button
              onClick={() => { selectBranch(null); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors ${!selectedBranchId ? 'bg-[#0F9291]/10 ring-1 ring-[#0F9291]/20' : ''}`}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${!selectedBranchId ? 'bg-[#0F9291] text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}><Layers className="w-4 h-4" /></span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm truncate ${!selectedBranchId ? 'font-semibold text-[#0F9291]' : 'font-medium text-gray-900 dark:text-white'}`}>All Branches</p>
                <p className="text-xs text-gray-500 truncate">View global data across all branches</p>
              </div>
              {!selectedBranchId && <Check className="w-4 h-4 text-[#0F9291] shrink-0" />}
            </button>

            {filtered.map(b => {
              const active = String(b.id) === String(selectedBranchId);
              return (
                <button
                  key={String(b.id)}
                  onClick={() => { selectBranch(String(b.id)); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors ${active ? 'bg-[#0F9291]/10 ring-1 ring-[#0F9291]/20' : ''}`}
                >
                  <BranchIcon type={b.type} active={active} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm truncate ${active ? 'font-semibold text-[#0F9291]' : 'font-medium text-gray-900 dark:text-white'}`}>{b.name}</p>
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1.5">{b.code} {b.city ? `· ${b.city}` : ''} <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${b.type === 'RETAIL' ? 'bg-sky-50 text-sky-700' : b.type === 'WAREHOUSE' ? 'bg-amber-50 text-amber-700' : 'bg-violet-50 text-violet-700'}`}>{b.type}</span></p>
                  </div>
                  {active && <Check className="w-4 h-4 text-[#0F9291] shrink-0" />}
                </button>
              );
            })}
            {filtered.length === 0 && <p className="px-3 py-8 text-center text-sm text-gray-400">No branches match “{query}”</p>}
          </div>

          <div className="p-2.5 border-t border-gray-100 dark:border-[#273244] bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-between">
            <span className="text-[11px] text-gray-400">{activeBranches.length} active</span>
            <button onClick={() => setOpen(false)} className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-[#0F9291]">Close</button>
           </div>
          </div>
         </div>
       )}
     </div>
  );
}
