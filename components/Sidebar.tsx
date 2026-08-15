'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Star, Clock, X, LogOut, Settings, HardDrive, ShieldCheck, Command, Menu,
} from '@/components/ui/LucideIcon';
import {
  NAV_SECTIONS, canSeeSection, canSeeItem, ROLE_LABELS, type NavItem,
} from '@/components/sidebar/nav';

const MAX_PINNED = 8;
const MAX_RECENT = 5;
const STORAGE_USED = 64.2;
const STORAGE_TOTAL = 512;
const SIDEBAR_EXPANDED = 280;
const SIDEBAR_COLLAPSED = 72;

const SHORTCUTS: Record<string, { href: string; key: string }> = {};
for (const s of NAV_SECTIONS) {
  for (const i of s.items) {
    if (i.shortcut) SHORTCUTS[i.shortcut.toLowerCase()] = { href: i.href, key: i.shortcut };
  }
}

const BADGE_STYLES: Record<string, string> = {
  new: 'bg-[#0F9291] text-white dark:bg-[#14B8A6] dark:text-white',
  hot: 'bg-[#E65B0D] text-white dark:bg-[#FA9200] dark:text-white',
  count: 'bg-[#0F9291]/10 text-[#0F9291] dark:bg-[#14B8A6]/15 dark:text-[#14B8A6]',
  sync: 'bg-[#3848F5]/10 text-[#3848F5] dark:bg-[#818CF8]/10 dark:text-[#818CF8]',
  expired: 'bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  low: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
};

function Stored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}

function isTypingTarget(e: Event | KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
}

function getExactActiveHref(pathname: string, items: NavItem[]): string | null {
  const clean = pathname.split('?')[0];
  const exact = items.find(i => i.href === clean);
  if (exact) return exact.href;

  const withSlash = items.filter(i => !i.href.startsWith('#') && clean.startsWith(i.href + '/'));
  if (withSlash.length === 0) return null;
  withSlash.sort((a, b) => b.href.length - a.href.length);
  return withSlash[0].href;
}

const SidebarBadge = memo(function SidebarBadge({ label, variant }: { label: string; variant: string }) {
  return (
    <span className={`shrink-0 text-[10px] font-semibold px-[6px] py-[2px] rounded-full leading-none ${BADGE_STYLES[variant] || 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'}`}>
      {label}
    </span>
  );
});

const FavoriteStar = memo(function FavoriteStar({ isPinned, isHovered }: { isPinned: boolean; isHovered: boolean }) {
  return (
    <Star className={`w-3.5 h-3.5 transition-all duration-200 ${
      isPinned ? 'fill-amber-400 text-amber-400 opacity-100' : 'opacity-0 group-hover/row:opacity-100 text-gray-400'
    }`} />
  );
});

interface SidebarMenuItemProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  isPinned: boolean;
  onNavigate: (href: string, name?: string) => void;
  onTogglePin: (item: NavItem, e: React.MouseEvent) => void;
  onRipple: (e: React.MouseEvent) => void;
  onTip: (el: HTMLElement, name: string, shortcut?: string) => void;
  onTipHide: () => void;
}

const SidebarMenuItem = memo(function SidebarMenuItem({
  item, active, collapsed, isPinned, onNavigate, onTogglePin, onRipple, onTip, onTipHide,
}: SidebarMenuItemProps) {
  const Icon = item.icon;

  return (
    <li className={`group/row relative ${collapsed ? 'flex items-center justify-center' : ''}`}>
      {item.href.startsWith('#') ? (
        <button
          onClick={(e) => { onRipple(e); onNavigate(item.href); }}
          onMouseEnter={(e) => onTip(e.currentTarget, item.name)}
          onMouseLeave={onTipHide}
          onFocus={(e) => onTip(e.currentTarget, item.name)}
          onBlur={onTipHide}
          aria-label={item.name}
          data-nav-index={item.href}
          className={`flex items-center gap-3 no-underline cursor-pointer select-none outline-none transition-all duration-200 w-full h-10 rounded-lg px-3 ${
            collapsed ? 'h-11 justify-center rounded-xl w-11' : ''
          } ${
            active
              ? 'bg-[#0F9291]/8 dark:bg-[#14B8A6]/10 text-[#0B7F7E] dark:text-[#14B8A6]'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-gray-200'
          } active:scale-[0.98]`}
        >
          <span className="flex items-center justify-center shrink-0 w-9 h-9 rounded-xl transition-all duration-200">
            <Icon className="w-[18px] h-[18px]" />
          </span>
          {!collapsed && (
            <>
              <span className="flex-1 min-w-0 truncate text-[14px] font-medium leading-tight">{item.name}</span>
              {item.shortcut && (
                <kbd className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.06] text-[11px] font-semibold text-gray-400 border border-gray-200 dark:border-white/[0.06] leading-none shrink-0">
                  <Command className="w-2.5 h-2.5" />{item.shortcut}
                </kbd>
              )}
              {item.badge && <SidebarBadge label={item.badge.label} variant={item.badge.variant} />}
            </>
          )}
        </button>
      ) : (
        <Link
          href={item.href}
          onClick={onRipple}
          onMouseEnter={(e) => onTip(e.currentTarget, item.name, item.shortcut)}
          onMouseLeave={onTipHide}
          onFocus={(e) => onTip(e.currentTarget, item.name, item.shortcut)}
          onBlur={onTipHide}
          aria-label={item.name}
          aria-current={active ? 'page' : undefined}
          data-nav-index={item.href}
          className={`flex items-center gap-3 no-underline cursor-pointer select-none outline-none transition-all duration-200 w-full h-10 rounded-lg px-3 ${
            collapsed ? 'h-11 justify-center rounded-xl' : ''
          } ${
            active
              ? 'bg-[#0F9291]/8 dark:bg-[#14B8A6]/10 text-[#0B7F7E] dark:text-[#14B8A6]'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-gray-200'
          } active:scale-[0.98]`}
        >
          <span className="flex items-center justify-center shrink-0 w-9 h-9 rounded-xl transition-all duration-200">
            <Icon className="w-[18px] h-[18px]" />
          </span>
          {!collapsed && (
            <>
              <span className="flex-1 min-w-0 truncate text-[14px] font-medium leading-tight">{item.name}</span>
              {item.shortcut && (
                <kbd className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.06] text-[11px] font-semibold text-gray-400 border border-gray-200 dark:border-white/[0.06] leading-none shrink-0">
                  <Command className="w-2.5 h-2.5" />{item.shortcut}
                </kbd>
              )}
              {item.badge && <SidebarBadge label={item.badge.label} variant={item.badge.variant} />}
              <button
                onClick={(e) => onTogglePin(item, e)}
                aria-label={isPinned ? `Unpin ${item.name}` : `Pin ${item.name}`}
                className={`w-6 h-6 flex items-center justify-center rounded-md border-0 bg-transparent cursor-pointer transition-all duration-200 ${
                  isPinned ? 'opacity-100 text-amber-500' : 'opacity-0 group-hover/row:opacity-100 text-gray-400 hover:text-[#0F9291]'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
            </>
          )}
        </Link>
      )}
    </li>
  );
});

const CollapseBtn = memo(function CollapseBtn({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      className="hidden lg:flex items-center justify-center w-9 h-9 rounded-xl border-0 bg-transparent cursor-pointer text-gray-500 dark:text-gray-400 transition-all duration-200 hover:bg-[#0F9291]/10 hover:text-[#0F9291] dark:hover:text-[#14B8A6] active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-[#0F9291]/60"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-250 ${collapsed ? 'rotate-180' : ''}`}>
        <path d="M11 17l-5-5 5-5" />
        <path d="M18 17l-5-5 5-5" />
      </svg>
    </button>
  );
});

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const role = user?.role;

  const [collapsed, setCollapsed] = useState<boolean>(() => Stored('ims.sidebar.collapsed', false));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pinned, setPinned] = useState<{ name: string; href: string }[]>(() => Stored('ims.sidebar.pinned', []));
  const [recent, setRecent] = useState<{ name: string; href: string }[]>(() => Stored('ims.sidebar.recent', []));
  const [tip, setTip] = useState<{ name: string; shortcut?: string; x: number; y: number } | null>(null);
  const [userCard, setUserCard] = useState(false);
  const [searchIndex, setSearchIndex] = useState(-1);
  const [flashPinned, setFlashPinned] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const tipTimer = useRef<number | null>(null);
  const touchStart = useRef<number | null>(null);

  // Compute visible sections based on role
  const visibleSections = useMemo(() => {
    return NAV_SECTIONS
      .filter(s => canSeeSection(s, role))
      .map(s => ({ ...s, items: s.items.filter(i => canSeeItem(i, role)) }));
  }, [role]);

  // Flatten all nav items for quick lookup
  const allNavItems = useMemo(() => {
    const items: NavItem[] = [];
    visibleSections.forEach(s => s.items.forEach(i => items.push(i)));
    return items;
  }, [visibleSections]);

  // Exact active route matching
  const activeHref = useMemo(() => getExactActiveHref(pathname, allNavItems), [pathname, allNavItems]);

  const isActive = useCallback((href?: string) => {
    if (!href || href.startsWith('#')) return false;
    return href === activeHref;
  }, [activeHref]);

  const pinnedItems = useMemo(
    () => pinned
      .map(p => ({ item: allNavItems.find(i => i.href === p.href), name: p.name, href: p.href }))
      .filter((p): p is { item: NavItem; name: string; href: string } => Boolean(p.item)),
    [pinned, allNavItems],
  );

  // Update recent on route change
  useEffect(() => {
    const activeItem = activeHref ? allNavItems.find(i => i.href === activeHref) : undefined;
    if (activeItem) {
      setRecent(prev => {
        const next = [{ name: activeItem.name, href: activeItem.href }, ...prev.filter(r => r.href !== activeItem.href)].slice(0, MAX_RECENT);
        return next;
      });
    }
  }, [activeHref, allNavItems]);

  // Persist settings
  useEffect(() => { localStorage.setItem('ims.sidebar.collapsed', JSON.stringify(collapsed)); }, [collapsed]);
  useEffect(() => { localStorage.setItem('ims.sidebar.pinned', JSON.stringify(pinned)); }, [pinned]);
  useEffect(() => { localStorage.setItem('ims.sidebar.recent', JSON.stringify(recent)); }, [recent]);

  // Close mobile on route change
  useEffect(() => { if (mobileOpen) setMobileOpen(false); }, [pathname, mobileOpen]);

  const clearTipTimer = useCallback(() => {
    if (tipTimer.current !== null) { window.clearTimeout(tipTimer.current); tipTimer.current = null; }
  }, []);

  const showTip = useCallback((el: HTMLElement, name: string, shortcut?: string) => {
    if (!collapsed) return;
    clearTipTimer();
    const r = el.getBoundingClientRect();
    const x = Math.min(r.right + 12, window.innerWidth - 220);
    const y = Math.max(8, Math.min(r.top + r.height / 2, window.innerHeight - 40));
    tipTimer.current = window.setTimeout(() => setTip({ name, shortcut, x, y }), 250);
  }, [collapsed, clearTipTimer]);

  const hideTip = useCallback(() => { clearTipTimer(); setTip(null); }, [clearTipTimer]);

  const addRipple = (e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const d = Math.max(rect.width, rect.height);
    const span = document.createElement('span');
    span.className = 'ripple';
    span.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - rect.left - d / 2}px;top:${e.clientY - rect.top - d / 2}px;position:absolute;border-radius:50%;background:currentColor;opacity:0.12;pointer-events:none;`;
    el.style.position = el.style.position || 'relative';
    el.appendChild(span);
    window.setTimeout(() => span.remove(), 600);
  };

  const navigate = useCallback((href: string, name?: string) => {
    setSearch('');
    setSearchIndex(-1);
    setMobileOpen(false);
    if (href.startsWith('#')) {
      if (href === '#search') {
        window.setTimeout(() => searchRef.current?.focus(), 50);
      } else if (href === '#favorites') {
        navRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
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

  useEffect(() => { setSearchIndex(-1); }, [search]);

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
        ...allNavItems.filter(i => !i.href.startsWith('#')).map(i => i.href),
      ].filter((h, idx, arr) => arr.indexOf(h) === idx);
      if (items.length === 0) return;
      const cur = (document.activeElement as HTMLElement | null)?.dataset?.navIndex;
      let i = cur ? items.indexOf(cur) : -1;
      i = e.key === 'ArrowDown' ? (i + 1) % items.length : (i <= 0 ? items.length - 1 : i - 1);
      document.querySelector<HTMLElement>(`[data-nav-index="${items[i]}"]`)?.focus();
      return;
    }
    if (e.key === 'Escape') {
      if (mobileOpen) { setMobileOpen(false); return; }
      if (search) { setSearch(''); setSearchIndex(-1); return; }
      if (!collapsed) setCollapsed(true);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  const avatarInitial = (user?.username || 'U').charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile floating toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        className="fixed top-4 left-4 z-[1060] lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-[#0F9291] text-white shadow-lg shadow-[#0F9291]/30 cursor-pointer border-0"
      >
        <Menu />
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
        onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchStart.current !== null && touchStart.current - e.changedTouches[0].clientX > 60) setMobileOpen(false);
          touchStart.current = null;
        }}
        className={`
          fixed lg:relative inset-y-0 left-0 z-[1080]
          flex flex-col h-screen
          bg-white dark:bg-[#0F172A]
          border-r border-gray-200/80 dark:border-white/[0.08]
          shadow-[0_0_60px_rgba(15,23,42,0.08)] dark:shadow-none
          transition-[width,transform] duration-250 ease-in-out
          ${collapsed ? 'lg:w-[72px]' : 'lg:w-[280px]'}
          ${mobileOpen ? 'w-[280px] translate-x-0' : 'w-[280px] -translate-x-full lg:translate-x-0'}
        `}
      >
        {/* ===== HEADER ===== */}
        <div className="shrink-0 h-[64px] flex items-center gap-3 px-4 border-b border-gray-100 dark:border-white/[0.08]">
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="flex items-center justify-center w-10 h-10 rounded-xl border-0 bg-transparent cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-[0_0_20px_rgba(15,146,145,0.4)] active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-[#0F9291]/60"
            >
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(15,146,145,0.3)]">
                <img src="/logo.jpg" alt="Inventory Management System" width={48} height={48} className="w-full h-full object-cover" draggable={false} />
              </div>
            </button>
          ) : (
            <>
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(15,146,145,0.3)] shrink-0">
                <img src="/logo.jpg" alt="Inventory Management System" width={48} height={48} className="w-full h-full object-cover" draggable={false} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="m-0 text-[15px] font-bold text-gray-900 dark:text-white truncate leading-tight">Inventory</p>
                <p className="m-0 text-[12px] text-gray-500 dark:text-gray-400 font-medium truncate">Management System</p>
              </div>
              <CollapseBtn collapsed={collapsed} onClick={() => setCollapsed(true)} />
            </>
          )}
        </div>

        {/* ===== SEARCH ===== */}
        {!collapsed && (
          <div className="shrink-0 px-4 pt-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={onSearchKey}
                placeholder="Search menu..."
                aria-label="Search menu"
                className="w-full h-10 pl-9 pr-16 rounded-xl text-[14px] bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none transition-all duration-200 focus:border-[#0F9291]/40 focus:bg-white dark:focus:bg-[#111827] focus:shadow-[0_0_0_3px_rgba(15,146,145,0.08)]"
              />
              {search ? (
                <button
                  onClick={() => { setSearch(''); searchRef.current?.focus(); }}
                  aria-label="Clear search"
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer border-0 bg-transparent p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400 dark:text-gray-500 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.08] border border-gray-200 dark:border-white/[0.06] leading-none pointer-events-none">
                  Cmd+K
                </span>
              )}
            </div>

            {search && (
              <div
                id="sidebar-search-listbox"
                role="listbox"
                aria-label="Search results"
                className="absolute left-4 right-4 top-full mt-1 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200/80 dark:border-white/[0.08] shadow-[0_20px_50px_rgba(15,23,42,0.18)] z-[1095] overflow-hidden"
              >
                {searchResults.length === 0 ? (
                  <p className="px-4 py-8 text-center text-[14px] text-gray-400 dark:text-gray-500">No results for &ldquo;{search}&rdquo;</p>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto scrollbar-thin py-1.5">
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
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left cursor-pointer border-0 bg-transparent transition-colors duration-150 ${
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
                            <span className="block text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{r.section}</span>
                          </span>
                          {r.item.shortcut && (
                            <kbd className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.06] leading-none shrink-0">
                              Cmd+{r.item.shortcut}
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

        {/* ===== SCROLLABLE NAVIGATION ===== */}
        <div ref={navRef} className="ims-sidebar-scroll flex-1 overflow-y-auto min-h-0">
          {/* Pinned */}
          {!search && pinnedItems.length > 0 && (
            <div className={`${collapsed ? 'pt-4 pb-2' : 'px-3 pt-3 pb-1'}`}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Pinned
                </p>
              )}
              <ul className={`flex flex-col ${collapsed ? 'gap-2 items-center' : 'gap-0.5'}`}>
                {pinnedItems.map(p => {
                  const pinActive = isActive(p.href);
                  return (
                    <li key={p.href} className={collapsed ? 'flex items-center justify-center' : ''}>
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
                        className={`flex items-center gap-3 no-underline cursor-pointer select-none outline-none transition-all duration-200 w-full h-10 rounded-lg px-3 ${
                          collapsed ? 'h-11 justify-center rounded-xl w-11' : ''
                        } ${
                          pinActive
                            ? 'bg-[#0F9291]/8 dark:bg-[#14B8A6]/10 text-[#0B7F7E] dark:text-[#14B8A6]'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-gray-200'
                        } active:scale-[0.98]`}
                      >
                        <span className="flex items-center justify-center shrink-0 w-9 h-9 rounded-xl transition-all duration-200">
                          <p.item.icon className="w-[18px] h-[18px]" />
                        </span>
                        {!collapsed && <span className="flex-1 min-w-0 truncate text-[14px] font-medium leading-tight">{p.name}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Recent */}
          {!search && recent.length > 0 && !collapsed && (
            <div className="px-3 pt-3 pb-1">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Recent
              </p>
              <ul className="flex flex-col gap-0.5">
                {recent.map(r => {
                  const item = allNavItems.find(i => i.href === r.href);
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
                        className={`flex items-center gap-3 no-underline cursor-pointer select-none outline-none transition-all duration-200 w-full h-10 rounded-lg px-3 ${
                          isActive(r.href)
                            ? 'bg-[#0F9291]/8 dark:bg-[#14B8A6]/10 text-[#0B7F7E] dark:text-[#14B8A6]'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-gray-200'
                        } active:scale-[0.98]`}
                      >
                        <span className="flex items-center justify-center shrink-0 w-8 h-8 rounded-lg bg-gray-100/80 dark:bg-white/[0.05] text-gray-400 dark:text-gray-500">
                          <item.icon className="w-[15px] h-[15px]" />
                        </span>
                        <span className="flex-1 min-w-0 truncate text-[13px] font-medium leading-tight">{r.name}</span>
                        <Clock className="w-3 h-3 text-gray-300 dark:text-gray-600 shrink-0" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Sections */}
          {visibleSections.map(section => (
            <div key={section.title} className={collapsed ? 'mt-6 first:mt-0' : 'mt-5 first:mt-0'}>
              {!collapsed && (
                <p className="px-4 mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
                  {section.title}
                </p>
              )}
              <ul className={`flex flex-col ${collapsed ? 'gap-2 items-center px-3' : 'gap-0.5 px-3'}`}>
                {section.items.map(item => (
                  <SidebarMenuItem
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    collapsed={collapsed}
                    isPinned={pinned.some(p => p.href === item.href)}
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

        {/* ===== FOOTER ===== */}
        <div className="shrink-0 border-t border-gray-100 dark:border-white/[0.08] bg-white dark:bg-[#0F172A]">
          <div
            className={`relative flex items-center gap-3 ${collapsed ? 'justify-center py-4' : 'px-4 py-3'}`}
            onMouseEnter={(e) => {
              if (!collapsed) return;
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setTip({ name: '', x: Math.min(r.right + 12, window.innerWidth - 260), y: r.top + r.height / 2 });
              setUserCard(true);
            }}
            onMouseLeave={() => { setUserCard(false); hideTip(); }}
          >
            <div className="relative shrink-0">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[#0F9291] to-teal-600 text-white font-bold text-[13px] shadow-[0_4px_12px_rgba(15,146,145,0.3)] transition-transform duration-200 hover:scale-105">
                {avatarInitial}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0F172A]" />
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="m-0 text-[14px] font-semibold text-gray-900 dark:text-white truncate leading-tight">{user?.username || 'User'}</p>
                  <p className="m-0 text-[12px] text-gray-500 dark:text-gray-400 truncate">{ROLE_LABELS[role || ''] || 'User'}</p>
                </div>
                <button
                  onClick={logout}
                  aria-label="Sign out"
                  className="flex items-center justify-center w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer text-gray-400 hover:text-red-500 hover:bg-red-500/8 transition-all duration-200 shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {!collapsed && (
            <div className="px-4 pb-3 pt-1">
              <div className="flex items-center justify-between text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-1.5">
                <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" /> Storage</span>
                <span>{STORAGE_USED} GB / {STORAGE_TOTAL} GB</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#0F9291] to-teal-400 transition-all duration-700" style={{ width: `${(STORAGE_USED / STORAGE_TOTAL) * 100}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-[#0F9291] dark:text-[#14B8A6]" /> Pro License</span>
                <span>v2.4.0</span>
              </div>
            </div>
          )}

          {/* Collapsed user card tooltip */}
          {collapsed && userCard && (
            <div
              className="absolute bottom-16 left-[calc(100%-4px)] z-[1095] w-56 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.08] shadow-[0_20px_50px_rgba(15,23,42,0.25)] p-3.5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-[#0F9291] to-teal-600 text-white font-bold text-[14px] shadow-[0_4px_12px_rgba(15,146,145,0.35)]">
                  {avatarInitial}
                </div>
                <div className="min-w-0">
                  <p className="m-0 text-[14px] font-bold text-gray-900 dark:text-white truncate">{user?.username || 'User'}</p>
                  <p className="m-0 text-[12px] text-gray-500 dark:text-gray-400 truncate">{ROLE_LABELS[role || ''] || 'User'}</p>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-1">
                  <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" /> Storage</span>
                  <span>{STORAGE_USED} GB / {STORAGE_TOTAL} GB</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#0F9291] to-teal-400" style={{ width: `${(STORAGE_USED / STORAGE_TOTAL) * 100}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 mb-3">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-[#0F9291] dark:text-[#14B8A6]" /> Pro License</span>
                <span>v2.4.0</span>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => { setUserCard(false); router.push('/settings/business'); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border-0 bg-transparent cursor-pointer text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-all duration-200"
                >
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border-0 bg-transparent cursor-pointer text-[13px] font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
          </div>
        )}
        </div>
      </aside>

      <style>{`
        .ims-sidebar-scroll::-webkit-scrollbar { width: 5px; }
        .ims-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .ims-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.2);
          border-radius: 10px;
          transition: background 150ms ease;
        }
        .ims-sidebar-scroll:hover::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.35);
        }
        html.dark .ims-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 189, 0.15);
        }
        html.dark .ims-sidebar-scroll:hover::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 189, 0.3);
        }
      `}</style>

      {/* ===== Collapsed Tooltip ===== */}
      {tip && tip.name && (
        <div
          className="fixed z-[1095] pointer-events-none bg-gray-900 dark:bg-[#1c1c1c] text-white text-[13px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl border border-white/10 whitespace-nowrap flex items-center gap-2"
          style={{ left: tip.x, top: tip.y, transform: 'translateY(-50%)' }}
        >
          {tip.name}
          {tip.shortcut && (
            <kbd className="text-[9px] font-semibold text-white/50 bg-white/10 rounded-md px-1.5 py-0.5 border border-white/10 leading-none">
              Cmd+{tip.shortcut}
            </kbd>
          )}
        </div>
      )}
    </>
  );
}

