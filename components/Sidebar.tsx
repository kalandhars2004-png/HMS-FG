'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Star, Clock, X, LogOut, Settings, HardDrive, ShieldCheck, Command,
} from '@/components/ui/LucideIcon';
import {
  NAV_SECTIONS, canSeeSection, canSeeItem, ROLE_LABELS, type NavItem,
} from '@/components/sidebar/nav';

const MAX_PINNED = 8;
const MAX_RECENT = 5;

const STORAGE_USED = 64.2;
const STORAGE_TOTAL = 512;

const SHORTCUTS: Record<string, { href: string; key: string }> = {};
for (const s of NAV_SECTIONS) {
  for (const i of s.items) {
    if (i.shortcut) SHORTCUTS[i.shortcut.toLowerCase()] = { href: i.href, key: i.shortcut };
  }
}

const BADGE_STYLES: Record<string, string> = {
  new: 'bg-gradient-to-r from-[#0F9291] to-teal-500 text-white',
  hot: 'bg-gradient-to-r from-[#E65B0D] to-[#FA9200] text-white',
  count: 'bg-[#0F9291]/10 text-[#0F9291] dark:bg-[#14B8A6]/10 dark:text-[#14B8A6]',
  sync: 'bg-[#3848F5]/10 text-[#3848F5] dark:bg-[#818CF8]/10 dark:text-[#818CF8]',
  expired: 'bg-red-500/10 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  low: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
};

const rowCls = (active: boolean, compact = false) =>
  `sidebar-row relative flex items-center gap-3 no-underline cursor-pointer select-none ${compact ? 'rounded-[16px]' : 'rounded-xl'} transition-all ${compact ? 'duration-150' : 'duration-200'} ${compact ? '' : 'hover:translate-x-[2px]'} active:scale-[0.98] outline-none ${compact ? '' : 'focus-visible:ring-2 focus-visible:ring-[#0F9291]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#111827]'} ${
    active
      ? 'font-bold text-[#0B7F7E] dark:text-[#14B8A6]'
      : 'font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-gray-200'
  }`;

const iconCls = (active: boolean) =>
  `flex items-center justify-center w-10 h-10 shrink-0 rounded-[14px] transition-all duration-200 ${
    active
      ? 'bg-[#0F9291]/10 dark:bg-[#14B8A6]/15 text-[#0F9291] dark:text-[#14B8A6] shadow-[0_2px_8px_rgba(15,146,145,0.25)] group-hover:scale-105'
      : 'bg-gray-100/80 dark:bg-white/[0.05] text-gray-500 dark:text-gray-400 group-hover:text-[#0F9291] dark:group-hover:text-[#14B8A6] group-hover:bg-[#0F9291]/8 dark:group-hover:bg-[#14B8A6]/10 group-hover:scale-105 group-hover:shadow-[0_2px_8px_rgba(15,146,145,0.12)]'
  }`;

const Badge = ({ label, variant }: { label: string; variant: string }) => (
  <span className={`shrink-0 text-[11px] font-bold px-1.5 py-[3px] rounded-full leading-none ${BADGE_STYLES[variant] || 'bg-gray-100 text-gray-500'}`}>
    {label}
  </span>
);

interface MenuRowProps {
  item: NavItem;
  navIndex?: string;
  active: boolean;
  collapsed: boolean;
  isPinned: boolean;
  pathname: string;
  onNavigate: (href: string, name?: string) => void;
  onTogglePin: (item: NavItem, e: React.MouseEvent) => void;
  onRipple: (e: React.MouseEvent) => void;
  onTip: (el: HTMLElement, name: string, shortcut?: string) => void;
  onTipHide: () => void;
}

const MenuRow = memo(function MenuRow({
  item, navIndex, active, collapsed, isPinned, pathname, onNavigate, onTogglePin, onRipple, onTip, onTipHide,
}: MenuRowProps) {
  const iconKey = collapsed && active ? `icon-${pathname}` : undefined;
  const inner = (
    <>
      <span
        key={iconKey}
        className={
          collapsed
            ? `flex items-center justify-center shrink-0 transition-all duration-150 ${
                active
                  ? 'text-white animate-icon-fill'
                  : 'text-[#7A8599] dark:text-gray-500 group-hover:text-[#344054] dark:group-hover:text-gray-200 group-hover:scale-105'
              }`
            : iconCls(active)
        }
      >
        <item.icon className="w-[22px] h-[22px]" />
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 min-w-0 truncate text-[14px] leading-tight">{item.name}</span>
          {item.shortcut && (
            <kbd className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.06] text-[11px] font-semibold text-gray-400 border border-gray-200 dark:border-white/[0.06] leading-none">
              <Command className="w-2.5 h-2.5" />{item.shortcut}
            </kbd>
          )}
          {item.badge && <Badge label={item.badge.label} variant={item.badge.variant} />}
          <span className="w-7 shrink-0" aria-hidden="true" />
        </>
      )}
    </>
  );

  const collapsedRow = collapsed
    ? `w-[48px] h-[48px] rounded-[16px] mx-auto flex items-center justify-center relative outline-none
       focus-visible:ring-2 focus-visible:ring-[#0F9291]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#111827]
       ${
         active
           ? 'bg-[#0F9291] shadow-[0_4px_14px_rgba(15,146,145,0.45)] scale-[1.04]'
           : 'hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:shadow-sm hover:scale-[1.03]'
       }`
    : '';

  const rowClsStr = rowCls(active, collapsed);
  const navHandler = (e: React.MouseEvent) => onRipple(e);

  return (
    <li className={`group/row relative ${collapsed ? 'flex items-center justify-center h-[56px]' : ''}`}>
      {item.href.startsWith('#') ? (
        <button
          onClick={(e) => { onRipple(e); onNavigate(item.href); }}
          onMouseEnter={(e) => onTip(e.currentTarget, item.name)}
          onMouseLeave={onTipHide}
          onFocus={(e) => onTip(e.currentTarget, item.name)}
          onBlur={onTipHide}
          aria-label={item.name}
          data-nav-index={navIndex}
          className={`${rowClsStr} group ${collapsed ? `justify-center ${collapsedRow}` : 'w-full h-[46px] px-2.5'}`}
        >
          {active && collapsed && (
            <span key={pathname} className="animate-indicator-in absolute left-[-2px] top-1/2 -translate-y-1/2 w-[4px] h-5 rounded-full bg-[#0F9291] shadow-[0_0_8px_rgba(15,146,145,0.8)]" />
          )}
          <span className="flex items-center justify-center">{inner}</span>
        </button>
      ) : (
        <Link
          href={item.href}
          onClick={navHandler}
          onMouseEnter={(e) => onTip(e.currentTarget, item.name, item.shortcut)}
          onMouseLeave={onTipHide}
          onFocus={(e) => onTip(e.currentTarget, item.name, item.shortcut)}
          onBlur={onTipHide}
          aria-label={item.name}
          aria-current={active ? 'page' : undefined}
          data-nav-index={navIndex}
          className={`${rowClsStr} group ${collapsed ? `justify-center ${collapsedRow}` : ''}`}
        >
          {active && collapsed && (
            <span key={pathname} className="animate-indicator-in absolute left-[-2px] top-1/2 -translate-y-1/2 w-[4px] h-5 rounded-full bg-[#0F9291] shadow-[0_0_8px_rgba(15,146,145,0.8)]" />
          )}
          <span className="flex items-center justify-center">{inner}</span>
        </Link>
      )}
      {!collapsed && !item.href.startsWith('#') && (
        <button
          onClick={(e) => onTogglePin(item, e)}
          aria-label={isPinned ? `Unpin ${item.name}` : `Pin ${item.name}`}
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md border-0 bg-transparent cursor-pointer transition-all duration-200 hover:bg-[#0F9291]/10 ${
            isPinned ? 'opacity-100 text-amber-500' : 'opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 text-gray-400 hover:text-[#0F9291]'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-400 text-amber-400' : ''}`} />
        </button>
      )}
    </li>
  );
});

const ToggleBtn = ({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    className={`hidden lg:flex items-center justify-center w-11 h-11 rounded-xl bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-white/[0.08] shadow-[0_2px_8px_rgba(15,23,42,0.1)] cursor-pointer text-gray-500 dark:text-gray-300 transition-all duration-[250ms] hover:bg-[#0F9291] hover:border-[#0F9291] hover:text-white hover:shadow-[0_4px_14px_rgba(15,146,145,0.35)] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#0F9291]/60 outline-none ${collapsed ? 'rotate-180' : ''}`}
  >
    <span className="relative block w-3.5 h-3.5">
      <span className="absolute left-0 top-[2px] block h-[1.5px] w-3.5 rounded-full bg-current" />
      <span className="absolute left-0 top-1/2 -translate-y-1/2 block h-[1.5px] w-3.5 rounded-full bg-current" />
      <span className="absolute left-0 bottom-[2px] block h-[1.5px] w-3.5 rounded-full bg-current" />
    </span>
  </button>
);

function Stored<T>(key: string, fallback: T) {  let v: T = fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) v = JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return v;
}

function isTypingTarget(e: Event | KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  return t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const role = user?.role;

  const [collapsed, setCollapsed] = useState<boolean>(() => typeof window !== 'undefined' ? Stored('ims.sidebar.collapsed', false) : false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>(() => typeof window !== 'undefined' ? window.location.pathname + window.location.search : pathname);
  const [search, setSearch] = useState('');
  const [pinned, setPinned] = useState<{ name: string; href: string }[]>(() => typeof window !== 'undefined' ? Stored('ims.sidebar.pinned', []) : []);
  const [recent, setRecent] = useState<{ name: string; href: string }[]>(() => typeof window !== 'undefined' ? Stored('ims.sidebar.recent', []) : []);
  const [tip, setTip] = useState<{ name: string; shortcut?: string; x: number; y: number } | null>(null);
  const [userCard, setUserCard] = useState(false);
  const [searchIndex, setSearchIndex] = useState(-1);
  const [flashPinned, setFlashPinned] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const tipTimer = useRef<number | null>(null);

  const visibleSections = useMemo(() => {
    return NAV_SECTIONS
      .filter(s => canSeeSection(s, role))
      .map(s => ({ ...s, items: s.items.filter(i => canSeeItem(i, role)) }));
  }, [role]);

  const itemIndex = useMemo(() => {
    const map = new Map<string, NavItem>();
    visibleSections.forEach(s => s.items.forEach(i => map.set(i.href, i)));
    return map;
  }, [visibleSections]);

  useEffect(() => {
    setCurrentUrl(window.location.pathname + window.location.search);
  }, [pathname]);

  const activeHref = useMemo(() => {
    const hrefs = [...itemIndex.keys()].filter(h => !h.startsWith('#'));
    if (hrefs.includes(currentUrl)) return currentUrl;
    const prefixes = hrefs
      .filter(h => !h.includes('?') && currentUrl.startsWith(h + '/'))
      .sort((a, b) => b.length - a.length);
    return prefixes.length ? prefixes[0] : null;
  }, [currentUrl, itemIndex]);

  const isActive = useCallback((href?: string) => {
    if (!href || href.startsWith('#')) return false;
    return href === activeHref;
  }, [activeHref]);

  useEffect(() => {
    localStorage.setItem('ims.sidebar.collapsed', JSON.stringify(collapsed));
  }, [collapsed]);
  useEffect(() => {
    localStorage.setItem('ims.sidebar.pinned', JSON.stringify(pinned));
  }, [pinned]);
  useEffect(() => {
    localStorage.setItem('ims.sidebar.recent', JSON.stringify(recent));
  }, [recent]);

  const pinnedItems = useMemo(
    () => pinned
      .map(p => ({ item: itemIndex.get(p.href), name: p.name, href: p.href }))
      .filter((p): p is { item: NavItem; name: string; href: string } => Boolean(p.item)),
    [pinned, itemIndex],
  );

  useEffect(() => {
    const activeItem = activeHref ? itemIndex.get(activeHref) : undefined;
    if (activeItem) {
      setRecent(prev => {
        const next = [{ name: activeItem.name, href: activeItem.href }, ...prev.filter(r => r.href !== activeItem.href)].slice(0, MAX_RECENT);
        return next;
      });
    }
  }, [activeHref, itemIndex]);

  useEffect(() => {
    if (mobileOpen) setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (collapsed) setCollapsed(false);
        window.setTimeout(() => searchRef.current?.focus(), collapsed ? 300 : 0);
        return;
      }
      if (mod && SHORTCUTS[e.key.toLowerCase()]) {
        e.preventDefault();
        const s = SHORTCUTS[e.key.toLowerCase()];
        router.push(s.href);
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!collapsed) return;
        e.preventDefault();
        const items = [
          ...pinnedItems.map(p => p.href),
          ...visibleSections.flatMap(s => s.items.map(i => i.href).filter(h => !h.startsWith('#'))),
        ].filter((h, idx, arr) => arr.indexOf(h) === idx);
        if (items.length === 0) return;
        const cur = (document.activeElement as HTMLElement)?.dataset?.navIndex;
        let i = cur ? items.indexOf(cur) : -1;
        i = e.key === 'ArrowDown' ? (i + 1) % items.length : (i <= 0 ? items.length - 1 : i - 1);
        document.querySelector<HTMLElement>(`[data-nav-index="${items[i]}"]`)?.focus();
        return;
      }
      if (e.key === 'Escape') {
        if (mobileOpen) {
          setMobileOpen(false);
          return;
        }
        if (search) {
          setSearch('');
          setSearchIndex(-1);
          return;
        }
        if (!collapsed) setCollapsed(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router, collapsed, search, pinnedItems, visibleSections, mobileOpen]);

  const navigate = useCallback((href: string, name?: string) => {
    setSearch('');
    setSearchIndex(-1);
    setMobileOpen(false);
    if (href.startsWith('#')) {
      if (href === '#search') {
        searchRef.current?.focus();
      } else if (href === '#favorites') {
        menuRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        setFlashPinned(true);
        window.setTimeout(() => setFlashPinned(false), 1600);
      }
      return;
    }
    if (name) {
      setRecent(prev => {
        const next = [{ name, href }, ...prev.filter(r => r.href !== href)].slice(0, MAX_RECENT);
        return next;
      });
    }
    router.push(href);
  }, [router]);

  const togglePin = useCallback((item: NavItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPinned(prev => {
      if (prev.some(p => p.href === item.href)) return prev.filter(p => p.href !== item.href);
      if (prev.length >= MAX_PINNED) return prev;
      return [...prev, { name: item.name, href: item.href }];
    });
  }, []);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const out: { item: NavItem; section: string }[] = [];
    for (const s of visibleSections) {
      for (const i of s.items) {
        if (i.name.toLowerCase().includes(q) && !i.href.startsWith('#')) {
          out.push({ item: i, section: s.title });
        }
      }
    }
    return out.slice(0, 20);
  }, [search, visibleSections]);

  useEffect(() => {
    setSearchIndex(-1);
  }, [search]);

  const onSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchIndex(prev => (prev + 1) % Math.max(searchResults.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchIndex(prev => (prev <= 0 ? Math.max(searchResults.length - 1, 0) : prev - 1));
    } else if (e.key === 'Enter') {
      const r = searchResults[searchIndex] || searchResults[0];
      if (r) navigate(r.item.href, r.item.name);
    } else if (e.key === 'Escape') {
      setSearch('');
    }
  };

  const clearTipTimer = useCallback(() => {
    if (tipTimer.current !== null) {
      window.clearTimeout(tipTimer.current);
      tipTimer.current = null;
    }
  }, []);

  const showTip = useCallback((el: HTMLElement, name: string, shortcut?: string) => {
    if (!collapsed) return;
    clearTipTimer();
    const r = el.getBoundingClientRect();
    const x = Math.min(r.right + 14, window.innerWidth - 220);
    const y = Math.max(8, Math.min(r.top + r.height / 2, window.innerHeight - 40));
    tipTimer.current = window.setTimeout(() => setTip({ name, shortcut, x, y }), 300);
  }, [collapsed, clearTipTimer]);

  const hideTip = useCallback(() => {
    clearTipTimer();
    setTip(null);
  }, [clearTipTimer]);

  const addRipple = (e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const d = Math.max(rect.width, rect.height);
    const span = document.createElement('span');
    span.className = 'ripple';
    span.style.width = span.style.height = `${d}px`;
    span.style.left = `${e.clientX - rect.left - d / 2}px`;
    span.style.top = `${e.clientY - rect.top - d / 2}px`;
    el.appendChild(span);
    window.setTimeout(() => span.remove(), 600);
  };

  const logo = (size = 'w-10 h-10', radius = 'rounded-[14px]') => (
    <span className={`block overflow-hidden shrink-0 shadow-[0_6px_16px_rgba(15,146,145,0.35)] ${radius} ${size}`}>
      <img src="/logo.jpg" alt="Inventory Management System" width={48} height={48} className="w-full h-full object-cover" draggable={false} />
    </span>
  );

  return (
    <>
      {/* Mobile floating toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        className="fixed top-4 left-4 z-[1060] lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-[#0F9291] text-white shadow-lg shadow-[#0F9291]/30 cursor-pointer border-0"
      >
        <MenuIcon />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[1070] bg-black/40 backdrop-blur-sm lg:hidden animate-fadeIn"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        aria-label="Primary navigation"
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current !== null && touchX.current - e.changedTouches[0].clientX > 60) setMobileOpen(false);
          touchX.current = null;
        }}
        className={`
          fixed lg:relative inset-y-0 left-0 z-[1080]
          flex flex-col bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xl border-r border-gray-200/70 dark:border-white/[0.06]
          shadow-[0_0_60px_rgba(15,23,42,0.08)] dark:shadow-none
          transition-[width,transform] duration-[250ms] ease-in-out
          ${collapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'}
          ${mobileOpen ? 'w-[240px] translate-x-0 rounded-r-[18px]' : 'w-[240px] -translate-x-full lg:translate-x-0 lg:rounded-none'}
        `}
      >
        {/* ===== Header (72px) ===== */}
        <div className={`flex items-center shrink-0 h-[72px] gap-3 px-4 border-b border-gray-100 dark:border-white/[0.05] ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="group flex items-center justify-center border-0 bg-transparent cursor-pointer rounded-full p-1.5 transition-all duration-200 hover:scale-110 hover:shadow-[0_0_24px_rgba(15,146,145,0.55)] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#0F9291]/60 outline-none"
            >
              {logo('w-12 h-12')}
            </button>
          ) : (
            logo()
          )}
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="m-0 text-[14px] font-bold text-gray-900 dark:text-white truncate leading-tight">Inventory</p>
                <p className="m-0 text-[12px] text-gray-400 dark:text-gray-500 font-medium truncate">Management System</p>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl border-0 bg-transparent cursor-pointer text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all duration-200 -mr-1"
              >
                <X className="w-4 h-4" />
              </button>
              <ToggleBtn collapsed={false} onClick={() => setCollapsed(true)} />
            </>
          )}
        </div>

        {/* Toggle inside the rail (collapsed) */}
        {collapsed && (
          <div className="hidden lg:flex items-center justify-center pt-5 pb-5 shrink-0">
            <ToggleBtn collapsed onClick={() => setCollapsed(false)} />
          </div>
        )}

        {/* ===== Search ===== */}
        {!collapsed && (
          <div className="relative px-3.5 pt-3.5 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={onSearchKey}
                placeholder="Search menu..."
                aria-label="Search menu"
                role="combobox"
                aria-expanded={search ? true : false}
                aria-controls="sidebar-search-listbox"
                aria-autocomplete="list"
                aria-activedescendant={searchIndex >= 0 && searchResults[searchIndex] ? `sidebar-search-opt-${searchIndex}` : undefined}
                className="w-full h-9 pl-9 pr-8 rounded-xl text-[14px] bg-gray-100/80 dark:bg-white/[0.05] border border-transparent focus:border-[#0F9291]/40 focus:bg-white dark:focus:bg-[#111827] outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400 transition-all duration-200"
              />
              {search ? (
                <button
                  onClick={() => { setSearch(''); searchRef.current?.focus(); }}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer border-0 bg-transparent p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400 px-1.5 py-0.5 rounded-md bg-white dark:bg-white/[0.08] border border-gray-200 dark:border-white/[0.06] leading-none pointer-events-none">
                  ⌘K
                </span>
              )}
            </div>

            {search && (
              <div
                id="sidebar-search-listbox"
                role="listbox"
                aria-label="Search results"
                className="absolute left-3.5 right-3.5 top-[calc(100%-4px)] bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/80 dark:border-white/[0.08] shadow-[0_16px_40px_rgba(15,23,42,0.14)] z-[1095] overflow-hidden animate-slide-down"
              >
                {searchResults.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[14px] text-gray-400">No menu items match “{search}”</p>
                ) : (
                  <div className="max-h-[320px] overflow-y-auto scrollbar-none py-1.5">
                    {searchResults.map((r, i) => {
                      const idx = r.item.name.toLowerCase().indexOf(search.trim().toLowerCase());
                      return (
                        <button
                          key={r.item.href}
                          id={`sidebar-search-opt-${i}`}
                          role="option"
                          aria-selected={i === searchIndex}
                          onClick={() => navigate(r.item.href, r.item.name)}
                          onMouseEnter={() => setSearchIndex(i)}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left cursor-pointer border-0 bg-transparent transition-colors duration-100 ${
                            i === searchIndex ? 'bg-[#0F9291]/8 dark:bg-[#14B8A6]/10' : ''
                          }`}
                        >
                          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 shrink-0">
                            <r.item.icon className="w-4 h-4" />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="text-[14px] font-semibold text-gray-800 dark:text-gray-100">
                              {idx >= 0 ? (
                                <>
                                  {r.item.name.slice(0, idx)}
                                  <mark className="bg-[#0F9291]/20 dark:bg-[#14B8A6]/25 text-inherit rounded-sm px-0.5">{r.item.name.slice(idx, idx + search.trim().length)}</mark>
                                  {r.item.name.slice(idx + search.trim().length)}
                                </>
                              ) : r.item.name}
                            </span>
                            <span className="block text-[11px] text-gray-400 mt-0.5">{r.section}</span>
                          </span>
                          {r.item.shortcut && (
                            <kbd className="text-[11px] font-semibold text-gray-400 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.06] leading-none">
                              Ctrl+{r.item.shortcut}
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== Menu ===== */}
        <div ref={menuRef} className={`flex-1 overflow-y-auto scrollbar-none menu-area ${collapsed ? 'px-[12px] pt-0' : 'px-2.5 py-3'}`}>
          {/* Pinned */}
          {!search && pinnedItems.length > 0 && (
            <div className={`rounded-xl transition-all duration-300 ${collapsed ? '' : 'mb-2'} ${flashPinned ? 'ring-2 ring-[#0F9291]/30 ring-offset-2 ring-offset-white dark:ring-offset-[#111827]' : ''}`}>
              {!collapsed && (
                <p className="mx-2.5 mt-1 mb-2 px-2 text-[12px] font-semibold uppercase tracking-[1.2px] text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Pinned
                </p>
              )}
              <ul className={`flex flex-col ${collapsed ? 'mx-0 gap-[16px]' : 'mx-2.5 gap-0.5'}`}>
                {pinnedItems.map(p => {
                  const pinActive = isActive(p.href);
                  return (
                    <li key={p.href} className={`group/row relative ${collapsed ? 'flex items-center justify-center h-[56px]' : ''}`}>
                      <Link
                        href={p.href}
                        onClick={addRipple}
                        onMouseEnter={(e) => showTip(e.currentTarget, p.name, p.item?.shortcut)}
                        onMouseLeave={hideTip}
                        onFocus={(e) => showTip(e.currentTarget, p.name, p.item?.shortcut)}
                        onBlur={hideTip}
                        aria-label={`${p.name} (pinned)`}
                        aria-current={pinActive ? 'page' : undefined}
                        data-nav-index={p.href}
                        className={`${rowCls(pinActive, collapsed)} group ${
                          collapsed
                            ? `justify-center w-[48px] h-[48px] rounded-[16px] mx-auto relative outline-none focus-visible:ring-2 focus-visible:ring-[#0F9291]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#111827] ${
                                pinActive
                                  ? 'bg-[#0F9291] shadow-[0_4px_14px_rgba(15,146,145,0.45)] scale-[1.04]'
                                  : 'hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:shadow-sm hover:scale-[1.03]'
                              }`
                            : ''
                        }`}
                      >
                        {pinActive && collapsed && (
                          <span key={pathname} className="animate-indicator-in absolute left-[-2px] top-1/2 -translate-y-1/2 w-[4px] h-5 rounded-full bg-[#0F9291] shadow-[0_0_8px_rgba(15,146,145,0.8)]" />
                        )}
                        <span
                          key={collapsed && pinActive ? `pin-${pathname}` : undefined}
                          className={
                            collapsed
                              ? `flex items-center justify-center shrink-0 transition-all duration-150 ${
                                  pinActive
                                    ? 'text-white animate-icon-fill'
                                    : 'text-[#7A8599] dark:text-gray-500 group-hover:text-[#344054] dark:group-hover:text-gray-200 group-hover:scale-105'
                                }`
                              : iconCls(pinActive)
                          }
                        >
                          <p.item.icon className="w-[22px] h-[22px]" />
                        </span>
                        {!collapsed && (
                          <>
                            <span className="flex-1 min-w-0 truncate text-[14px]">{p.name}</span>
                            <span className="w-7 shrink-0" aria-hidden="true" />
                          </>
                        )}
                      </Link>
                      {collapsed ? (
                        <button
                          onClick={(e) => togglePin(p.item, e)}
                          aria-label={`Unpin ${p.name}`}
                          className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white border-2 border-white dark:border-[#111827] shadow-sm opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 cursor-pointer transition-all duration-150 hover:scale-110"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => togglePin(p.item, e)}
                          aria-label={`Unpin ${p.name}`}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md border-0 bg-transparent cursor-pointer text-amber-500 opacity-100 transition-all duration-200 hover:bg-[#0F9291]/10"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Recent */}
          {!search && recent.length > 0 && !collapsed && (
            <div className="mb-2">
              <p className="mx-2.5 mt-4 mb-2 px-2 text-[12px] font-semibold uppercase tracking-[1.2px] text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Recent
              </p>
              <ul className="flex flex-col gap-0.5 mx-2.5">
                {recent.map(r => {
                  const item = itemIndex.get(r.href);
                  if (!item) return null;
                  return (
                    <li key={r.href}>
                      <Link
                        href={r.href}
                        onClick={addRipple}
                        onMouseEnter={(e) => showTip(e.currentTarget, r.name, item.shortcut)}
                        onMouseLeave={hideTip}
                        onFocus={(e) => showTip(e.currentTarget, r.name, item.shortcut)}
                        onBlur={hideTip}
                        className={`${rowCls(isActive(r.href))} group`}
                      >
                        <span className="w-10 h-10 shrink-0 rounded-[14px] flex items-center justify-center bg-gray-100/80 dark:bg-white/[0.05] text-gray-400 dark:text-gray-500">
                          <item.icon className="w-[18px] h-[18px]" />
                        </span>
                        <span className="flex-1 min-w-0 truncate text-[14px]">{r.name}</span>
                        <Clock className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Sections */}
          {visibleSections.map(section => (
            <div key={section.title} className={collapsed ? 'mt-8 first:mt-0' : ''}>
              {!collapsed && (
                <p className="mx-2.5 mt-5 mb-2 px-2 text-[12px] font-semibold uppercase tracking-[1.2px] text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                  <section.icon className="w-3.5 h-3.5 text-[#0F9291] dark:text-[#14B8A6]" />
                  {section.title}
                </p>
              )}
              {collapsed && (
                <div className="flex items-center justify-center first:hidden">
                  <span className="w-8 h-px bg-gray-200/70 dark:bg-white/[0.08]" />
                </div>
              )}
              <ul className={`flex flex-col ${collapsed ? 'mx-0 gap-[16px]' : 'mx-2.5 gap-0.5'}`}>
                {section.items.map(item => (
                  <MenuRow
                    key={item.href}
                    item={item}
                    navIndex={item.href}
                    active={isActive(item.href)}
                    collapsed={collapsed}
                    isPinned={pinned.some(p => p.href === item.href)}
                    pathname={pathname}
                    onNavigate={navigate}
                    onTogglePin={togglePin}
                    onRipple={addRipple}
                    onTip={showTip}
                    onTipHide={hideTip}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ===== Footer ===== */}
        <div className={`shrink-0 border-t border-gray-100 dark:border-white/[0.05] footer-area ${collapsed ? 'px-[12px] py-6' : 'p-3'}`}>
          <div
            className={`flex items-center gap-3 rounded-2xl p-2 ${collapsed ? 'justify-center relative' : 'bg-gray-50/80 dark:bg-white/[0.03]'}`}
            onMouseEnter={(e) => {
              if (!collapsed) return;
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setTip({ name: '', x: Math.min(r.right + 14, window.innerWidth - 240), y: r.top + r.height / 2 });
              setUserCard(true);
            }}
            onMouseLeave={() => { setUserCard(false); hideTip(); }}
          >
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-[#0F9291] to-teal-600 text-white font-bold text-[15px] shadow-[0_4px_12px_rgba(15,146,145,0.35)] transition-transform duration-200 hover:scale-105">
                {(user?.username || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#111827]" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="m-0 text-[14px] font-semibold text-gray-900 dark:text-white truncate">{user?.username || 'User'}</p>
                <p className="m-0 text-[12px] text-gray-400 dark:text-gray-500 truncate">
                  {ROLE_LABELS[role || ''] || (role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User')}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={logout}
                aria-label="Sign out"
                className="flex items-center justify-center w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer text-gray-400 hover:text-red-500 hover:bg-red-500/8 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {!collapsed && (
            <div className="mt-2 px-2 pb-0.5">
              <div className="flex items-center justify-between text-[11px] font-medium text-gray-400 mb-1.5">
                <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" /> Storage</span>
                <span>{STORAGE_USED} GB / {STORAGE_TOTAL} GB</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#0F9291] to-teal-400 transition-all duration-700" style={{ width: `${(STORAGE_USED / STORAGE_TOTAL) * 100}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2.5 text-[11px] text-gray-400">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-[#0F9291]" /> Pro License</span>
                <span>v2.4.0</span>
              </div>
            </div>
          )}

          {/* User hover card (collapsed) */}
          {collapsed && userCard && (
            <div
              className="absolute bottom-3 left-[calc(100%-4px)] z-[1095] w-56 rounded-2xl bg-[#111827]/95 dark:bg-[#1c1c1c]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.35)] p-3.5 animate-tip-in"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-11 h-11 shrink-0 rounded-full bg-gradient-to-br from-[#0F9291] to-teal-600 text-white font-bold text-[15px] shadow-[0_4px_12px_rgba(15,146,145,0.4)]">
                  {(user?.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="m-0 text-[14px] font-bold text-white truncate">{user?.username || 'User'}</p>
                  <p className="m-0 text-[12px] text-white/50 truncate">
                    {ROLE_LABELS[role || ''] || (role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User')}
                  </p>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between text-[11px] font-medium text-white/40 mb-1">
                  <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" /> Storage</span>
                  <span>{STORAGE_USED} GB / {STORAGE_TOTAL} GB</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#0F9291] to-teal-400" style={{ width: `${(STORAGE_USED / STORAGE_TOTAL) * 100}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-white/40 mb-3">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-[#14B8A6]" /> Pro License</span>
                <span>v2.4.0</span>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => { setUserCard(false); router.push('/settings/business'); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border-0 bg-transparent cursor-pointer text-[13px] font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200"
                >
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border-0 bg-transparent cursor-pointer text-[13px] font-medium text-white/80 hover:bg-red-500/15 hover:text-red-400 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tooltip (collapsed) */}
        {tip && tip.name && (
          <div
            className="fixed z-[1095] pointer-events-none bg-[#111827] dark:bg-[#1c1c1c] text-white text-[13px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl border border-white/10 whitespace-nowrap flex items-center gap-2 animate-tip-in"
            style={{ left: tip.x, top: tip.y, transform: 'translateY(-50%)' }}
          >
            {tip.name}
            {tip.shortcut && (
              <kbd className="text-[9px] font-semibold text-white/50 bg-white/10 rounded-md px-1.5 py-0.5 border border-white/10 leading-none">Ctrl+{tip.shortcut}</kbd>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}
