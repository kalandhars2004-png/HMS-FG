'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { shouldIgnoreGlobalKey } from '@/lib/modal-guard';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Star, X, LogOut, Settings, Command, Menu,
} from '@/components/ui/LucideIcon';
import {
  NAV_SECTIONS, canSeeSection, canSeeItem, ROLE_LABELS, type NavItem,
} from '@/components/sidebar/nav';

/* ------------------------------------------------------------------ */
/* Design tokens — dark pharmacy-POS teal.                              */
/* This surface keeps its own palette in both app themes so the brand   */
/* reads the same everywhere; it does not follow light/dark mode.       */
/* ------------------------------------------------------------------ */
const S = {
  bg: '#041A19',          // one flat background, no gradient
  active: '#0A3B38',      // active row container — lifted to hold contrast on the darker ground
  hover: 'rgba(0,166,166,0.08)',
  icon: '#00A6A6',        // unified icon teal
  text: '#F4F7F7',
  textMuted: 'rgba(244,247,247,0.62)',
  section: 'rgba(255,255,255,0.75)',
  hairline: 'rgba(255,255,255,0.07)',
};

const WIDTH_EXPANDED = 260;
const WIDTH_COLLAPSED = 72;

const ICON_COL = 36;     // fixed icon column — every label starts at the same x
const ROW_H = 44;        // menu item height
const ROW_GAP = 4;       // space between items
const RADIUS = 12;

const MAX_PINNED = 8;

const SHORTCUTS: Record<string, { href: string; key: string }> = {};
for (const s of NAV_SECTIONS) {
  for (const i of s.items) {
    if (i.shortcut) SHORTCUTS[i.shortcut.toLowerCase()] = { href: i.href, key: i.shortcut };
  }
}

const BADGE_STYLES: Record<string, string> = {
  new: 'bg-[#00A6A6] text-[#04201F]',
  hot: 'bg-[#FA9200] text-[#2A1600]',
  count: 'bg-white/10 text-[#9FEFEC]',
  sync: 'bg-white/10 text-[#9FB8EF]',
  expired: 'bg-red-500/20 text-red-300',
  low: 'bg-amber-500/20 text-amber-300',
};

function Stored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}

/** Exactly one row may be active: prefer an exact path match, else the longest prefix. */
function getExactActiveHref(pathname: string, items: NavItem[]): string | null {
  const clean = pathname.split('?')[0];
  const exact = items.find(i => i.href.split('?')[0] === clean);
  if (exact) return exact.href;

  const withSlash = items.filter(i => !i.href.startsWith('#') && clean.startsWith(i.href.split('?')[0] + '/'));
  if (withSlash.length === 0) return null;
  withSlash.sort((a, b) => b.href.length - a.href.length);
  return withSlash[0].href;
}

const SidebarBadge = memo(function SidebarBadge({ label, variant }: { label: string; variant: string }) {
  return (
    <span className={`shrink-0 text-[10px] font-semibold px-[7px] py-[3px] rounded-full leading-none ${BADGE_STYLES[variant] || 'bg-white/10 text-white/70'}`}>
      {label}
    </span>
  );
});

/* ------------------------------------------------------------------ */
/* Menu row                                                            */
/* ------------------------------------------------------------------ */

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

  const rowStyle: React.CSSProperties = {
    height: ROW_H,
    borderRadius: RADIUS,
    background: active ? S.active : 'transparent',
    color: active ? S.text : S.textMuted,
  };

  const content = (
    <>
      {/* Fixed icon column keeps every label on the same x-coordinate */}
      <span
        className="flex items-center justify-center shrink-0"
        style={{ width: ICON_COL, height: ICON_COL }}
      >
        <Icon
          className={`w-[22px] h-[22px] transition-colors duration-150 ${active ? 'text-[#3FE0DC]' : 'text-[#00A6A6]'}`}
        />
      </span>
      {!collapsed && (
        <>
          <span
            className="ims-reveal flex-1 min-w-0 truncate text-left leading-tight"
            style={{ fontSize: 14, fontWeight: active ? 500 : 400, color: S.text }}
          >
            {item.name}
          </span>
          <span className="ml-2 flex items-center gap-1.5 shrink-0">
            {item.shortcut && (
              <kbd className="hidden xl:inline-flex items-center gap-0.5 h-[24px] px-1.5 rounded-md bg-white/[0.07] text-[11px] font-semibold text-white/45 leading-none">
                <Command className="w-2.5 h-2.5" />{item.shortcut}
              </kbd>
            )}
            {item.badge && <SidebarBadge label={item.badge.label} variant={item.badge.variant} />}
            {!item.href.startsWith('#') && (
              /* Collapses to zero width until hovered or pinned. Reserving 24px on
                 every row for an invisible star was stealing space from the label
                 and forcing names like "Batch Management" to ellipsize. */
              <button
                onClick={(e) => onTogglePin(item, e)}
                aria-label={isPinned ? `Unpin ${item.name}` : `Pin ${item.name}`}
                className={`ims-pin h-6 flex items-center justify-center rounded-md border-0 bg-transparent cursor-pointer overflow-hidden ${
                  isPinned ? 'is-pinned' : ''
                }`}
              >
                <Star className={`w-3.5 h-3.5 shrink-0 ${isPinned ? 'fill-amber-400 text-amber-400' : 'text-white/40'}`} />
              </button>
            )}
          </span>
        </>
      )}
    </>
  );

  const tipHandlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => onTip(e.currentTarget, item.name, item.shortcut),
    onMouseLeave: onTipHide,
    onFocus: (e: React.FocusEvent<HTMLElement>) => onTip(e.currentTarget, item.name, item.shortcut),
    onBlur: onTipHide,
  };

  const cls = `ims-row group/row relative flex items-center no-underline cursor-pointer select-none outline-none
    transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#00A6A6]/50
    ${collapsed ? 'justify-center px-0' : 'px-3'} ${active ? 'is-active' : ''}`;

  return (
    <li className={collapsed ? 'flex justify-center' : ''}>
      {item.href.startsWith('#') ? (
        <button
          onClick={(e) => { onRipple(e); onNavigate(item.href); }}
          aria-label={item.name}
          data-nav-index={item.href}
          className={cls}
          style={{ ...rowStyle, width: collapsed ? ICON_COL + 12 : '100%', gap: collapsed ? 0 : 14 }}
          {...tipHandlers}
        >
          {content}
        </button>
      ) : (
        <Link
          href={item.href}
          onClick={onRipple}
          aria-label={item.name}
          aria-current={active ? 'page' : undefined}
          data-nav-index={item.href}
          className={cls}
          style={{ ...rowStyle, width: collapsed ? ICON_COL + 12 : '100%', gap: collapsed ? 0 : 14 }}
          {...tipHandlers}
        >
          {content}
        </Link>
      )}
    </li>
  );
});

/** Circular teal collapse control, pinned inside the sidebar header. */
const CollapseBtn = memo(function CollapseBtn({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      aria-expanded={!collapsed}
      aria-controls="ims-sidebar-nav"
      title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      className="ims-collapse hidden lg:flex items-center justify-center shrink-0 rounded-full
                 border-0 cursor-pointer outline-none relative overflow-hidden"
    >
      {/* Lit top edge — gives the disc a physical, machined feel rather than a flat fill */}
      <span className="ims-collapse-sheen" aria-hidden="true" />
      <svg
        width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
        className="ims-collapse-chevron relative z-[1]"
        style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }}
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
});

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const role = user?.role;

  const [collapsed, setCollapsed] = useState<boolean>(() => Stored('ims.sidebar.collapsed', false));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pinned, setPinned] = useState<{ name: string; href: string }[]>(() => Stored('ims.sidebar.pinned', []));
  const [tip, setTip] = useState<{ name: string; shortcut?: string; x: number; y: number } | null>(null);
  const [userCard, setUserCard] = useState(false);
  const [searchIndex, setSearchIndex] = useState(-1);

  const searchRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const tipTimer = useRef<number | null>(null);
  const touchStart = useRef<number | null>(null);

  const visibleSections = useMemo(
    () => NAV_SECTIONS
      .filter(s => canSeeSection(s, role))
      .map(s => ({ ...s, items: s.items.filter(i => canSeeItem(i, role)) })),
    [role],
  );

  const allNavItems = useMemo(() => {
    const items: NavItem[] = [];
    visibleSections.forEach(s => s.items.forEach(i => items.push(i)));
    return items;
  }, [visibleSections]);

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

  useEffect(() => { localStorage.setItem('ims.sidebar.collapsed', JSON.stringify(collapsed)); }, [collapsed]);
  useEffect(() => { localStorage.setItem('ims.sidebar.pinned', JSON.stringify(pinned)); }, [pinned]);
  useEffect(() => { if (mobileOpen) setMobileOpen(false); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearTipTimer = useCallback(() => {
    if (tipTimer.current !== null) { window.clearTimeout(tipTimer.current); tipTimer.current = null; }
  }, []);

  const showTip = useCallback((el: HTMLElement, name: string, shortcut?: string) => {
    if (!collapsed) return;
    clearTipTimer();
    const r = el.getBoundingClientRect();
    const x = Math.min(r.right + 12, window.innerWidth - 220);
    const y = Math.max(8, Math.min(r.top + r.height / 2, window.innerHeight - 40));
    tipTimer.current = window.setTimeout(() => setTip({ name, shortcut, x, y }), 220);
  }, [collapsed, clearTipTimer]);

  const hideTip = useCallback(() => { clearTipTimer(); setTip(null); }, [clearTipTimer]);

  const addRipple = (e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const d = Math.max(rect.width, rect.height);
    const span = document.createElement('span');
    span.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - rect.left - d / 2}px;top:${e.clientY - rect.top - d / 2}px;position:absolute;border-radius:50%;background:#00A6A6;opacity:0.16;pointer-events:none;transform:scale(0);animation:ripple-anim 600ms ease-out forwards;`;
    el.appendChild(span);
    window.setTimeout(() => span.remove(), 600);
  };

  const navigate = useCallback((href: string, name?: string) => {
    setSearch('');
    setSearchIndex(-1);
    setMobileOpen(false);
    if (href.startsWith('#')) {
      if (href === '#search') window.setTimeout(() => searchRef.current?.focus(), 50);
      else if (href === '#favorites') navRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
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
        if (i.name.toLowerCase().includes(q) && !i.href.startsWith('#')) out.push({ item: i, section: s.title });
      }
    }
    return out.slice(0, 20);
  }, [search, visibleSections]);

  useEffect(() => { setSearchIndex(-1); }, [search]);

  const onSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSearchIndex(p => (p + 1) % Math.max(searchResults.length, 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSearchIndex(p => (p <= 0 ? Math.max(searchResults.length - 1, 0) : p - 1)); }
    else if (e.key === 'Enter') { const r = searchResults[searchIndex] || searchResults[0]; if (r) navigate(r.item.href, r.item.name); }
    else if (e.key === 'Escape') setSearch('');
  };

  const onKey = useCallback((e: KeyboardEvent) => {
    if (shouldIgnoreGlobalKey(e)) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (collapsed) setCollapsed(false);
      window.setTimeout(() => searchRef.current?.focus(), collapsed ? 260 : 0);
      return;
    }
    if (mod && SHORTCUTS[e.key.toLowerCase()]) {
      e.preventDefault();
      router.push(SHORTCUTS[e.key.toLowerCase()].href);
      return;
    }
    if (e.key === 'Escape') {
      if (mobileOpen) { setMobileOpen(false); return; }
      if (search) { setSearch(''); setSearchIndex(-1); }
    }
  }, [collapsed, mobileOpen, search, router]);

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  const avatarInitial = (user?.username || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile opener */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        className="fixed top-4 left-4 z-[1060] lg:hidden flex items-center justify-center w-10 h-10 rounded-xl text-white border-0 cursor-pointer shadow-lg"
        style={{ background: S.icon }}
      >
        <Menu />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[1070] bg-black/50 backdrop-blur-[2px] lg:hidden animate-fadeIn"
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
        className={`ims-sidebar fixed lg:relative inset-y-0 left-0 z-[1080] flex flex-col h-screen
          ims-width-tween transition-transform duration-200 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{
          background: S.bg,
          width: collapsed ? WIDTH_COLLAPSED : WIDTH_EXPANDED,
          minWidth: collapsed ? WIDTH_COLLAPSED : WIDTH_EXPANDED,
        }}
      >
        {/* ===== HEADER — logo left, collapse right ===== */}
        <div
          className={`shrink-0 overflow-hidden flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}
          style={{ paddingTop: 24, paddingLeft: collapsed ? 0 : 26, paddingRight: collapsed ? 0 : 18 }}
        >
          {collapsed ? (
            /* Expanding uses the same control as collapsing, so the interaction
               is symmetric in both directions. */
            <div className="flex flex-col items-center gap-3">
              {/* The logo is also the expand affordance while collapsed — it is the
                  largest target in the rail and the first thing people click. */}
              <button
                onClick={() => setCollapsed(false)}
                aria-label="Expand sidebar"
                aria-expanded={false}
                title="Expand sidebar"
                className="ims-logo-btn rounded-xl overflow-hidden shrink-0 border-0 p-0 bg-transparent cursor-pointer outline-none"
                style={{ width: 40, height: 40 }}
              >
                <img src="/logo.jpg" alt="Inventory Management System" className="w-full h-full object-cover" draggable={false} />
              </button>
              <CollapseBtn collapsed={collapsed} onClick={() => setCollapsed(false)} />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 min-w-0" style={{ maxWidth: 172 }}>
                <span className="rounded-xl overflow-hidden shrink-0" style={{ width: 40, height: 40 }}>
                  <img src="/logo.jpg" alt="Inventory Management System" className="w-full h-full object-cover" draggable={false} />
                </span>
                <span className="ims-reveal min-w-0">
                  <span className="block truncate leading-tight" style={{ color: S.text, fontSize: 16, fontWeight: 700 }}>
                    Inventory
                  </span>
                  <span className="block truncate leading-tight" style={{ color: S.textMuted, fontSize: 12 }}>
                    Management System
                  </span>
                </span>
              </div>
              <CollapseBtn collapsed={collapsed} onClick={() => setCollapsed(true)} />
            </>
          )}
        </div>

        {/* Search — kept for Cmd+K; sits inside the header block */}
        {!collapsed && (
          <div className="shrink-0 relative" style={{ paddingLeft: 26, paddingRight: 18, paddingTop: 18 }}>
            <Search className="absolute left-[38px] top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'rgba(244,247,247,0.4)', marginTop: 9 }} />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onSearchKey}
              placeholder="Search menu..."
              aria-label="Search menu"
              className="w-full h-10 pl-9 pr-3 rounded-[12px] text-[14px] outline-none transition-colors duration-150 border"
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderColor: S.hairline,
                color: S.text,
              }}
            />
            {search && (
              <>
                <button
                  onClick={() => { setSearch(''); searchRef.current?.focus(); }}
                  aria-label="Clear search"
                  className="absolute right-[26px] top-1/2 translate-y-[2px] border-0 bg-transparent cursor-pointer p-1"
                  style={{ color: 'rgba(244,247,247,0.5)' }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div
                  role="listbox"
                  aria-label="Search results"
                  className="absolute left-[26px] right-[18px] top-full mt-1.5 rounded-[14px] overflow-hidden z-[1095] border"
                  style={{ background: '#08302E', borderColor: S.hairline, boxShadow: '0 20px 50px rgba(0,0,0,.45)' }}
                >
                  {searchResults.length === 0 ? (
                    <p className="px-4 py-6 text-center text-[13px]" style={{ color: S.textMuted }}>
                      No results for &ldquo;{search}&rdquo;
                    </p>
                  ) : (
                    <div className="ims-sidebar-scroll max-h-[300px] overflow-y-auto py-1.5">
                      {searchResults.map((r, i) => (
                        <button
                          key={r.item.href}
                          role="option"
                          aria-selected={i === searchIndex}
                          onClick={() => navigate(r.item.href, r.item.name)}
                          onMouseEnter={() => setSearchIndex(i)}
                          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left cursor-pointer border-0 transition-colors duration-150"
                          style={{ background: i === searchIndex ? S.hover : 'transparent' }}
                        >
                          <span className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <r.item.icon className="w-4 h-4 text-[#00A6A6]" />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-[14px] font-medium truncate" style={{ color: S.text }}>{r.item.name}</span>
                            <span className="block text-[11px]" style={{ color: S.textMuted }}>{r.section}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Header → navigation separation */}
        <div className="shrink-0" style={{ height: 22 }} />

        {/* ===== NAVIGATION (scrolls independently) ===== */}
        <div
          ref={navRef}
          id="ims-sidebar-nav"
          className="ims-sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden min-h-0"
          style={{ paddingLeft: collapsed ? 0 : 12, paddingRight: collapsed ? 0 : 12 }}
        >
          {/* Pinned */}
          {!search && pinnedItems.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {!collapsed && (
                <p className="ims-reveal flex items-center gap-1.5 px-3" style={{ color: S.section, fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Pinned
                </p>
              )}
              <ul className="flex flex-col" style={{ gap: ROW_GAP, alignItems: collapsed ? 'center' : undefined }}>
                {pinnedItems.map(p => (
                  <SidebarMenuItem
                    key={`pin-${p.href}`}
                    item={p.item}
                    active={isActive(p.href)}
                    collapsed={collapsed}
                    isPinned
                    onNavigate={navigate}
                    onTogglePin={togglePin}
                    onRipple={addRipple}
                    onTip={showTip}
                    onTipHide={hideTip}
                  />
                ))}
              </ul>
            </div>
          )}

          {/* Sections */}
          {visibleSections.map(section => (
            <div key={section.title} style={{ marginBottom: 16 }}>
              {!collapsed && (
                <p className="ims-reveal px-3" style={{ color: S.section, fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                  {section.title}
                </p>
              )}
              {collapsed && <div className="mx-auto mb-3" style={{ width: 24, height: 1, background: S.hairline }} />}
              <ul className="flex flex-col" style={{ gap: ROW_GAP, alignItems: collapsed ? 'center' : undefined }}>
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

        {/* ===== FOOTER (fixed) ===== */}
        <div className="shrink-0 relative" style={{ borderTop: `1px solid ${S.hairline}`, background: S.bg }}>
          <div
            className={`flex items-center gap-3 ${collapsed ? 'justify-center py-4' : ''}`}
            style={collapsed ? undefined : { paddingLeft: 26, paddingRight: 18, paddingTop: 14, paddingBottom: 14 }}
            onMouseEnter={() => { if (collapsed) setUserCard(true); }}
            onMouseLeave={() => setUserCard(false)}
          >
            <div
              className="flex items-center justify-center rounded-full shrink-0 font-bold"
              style={{ width: 38, height: 38, background: S.icon, color: '#04201F', fontSize: 14 }}
            >
              {avatarInitial}
            </div>
            {!collapsed && (
              <>
                <div className="ims-reveal flex-1 min-w-0">
                  <p className="m-0 truncate leading-tight" style={{ color: S.text, fontSize: 14, fontWeight: 500 }}>
                    {user?.email || user?.username || 'User'}
                  </p>
                  <p className="m-0 truncate leading-tight" style={{ color: S.textMuted, fontSize: 12 }}>
                    {ROLE_LABELS[role || ''] || 'User'}
                  </p>
                </div>
                <button
                  onClick={logout}
                  aria-label="Sign out"
                  title="Sign out"
                  className="flex items-center justify-center w-9 h-9 rounded-lg border-0 bg-transparent cursor-pointer transition-colors duration-150 shrink-0 hover:bg-red-500/15"
                  style={{ color: 'rgba(244,247,247,0.55)' }}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Collapsed account card */}
          {collapsed && userCard && (
            <div
              className="absolute bottom-3 left-[calc(100%+8px)] z-[1095] w-56 rounded-2xl p-3.5 border"
              style={{ background: '#08302E', borderColor: S.hairline, boxShadow: '0 20px 50px rgba(0,0,0,.5)' }}
              onMouseEnter={() => setUserCard(true)}
              onMouseLeave={() => setUserCard(false)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full font-bold" style={{ background: S.icon, color: '#04201F' }}>
                  {avatarInitial}
                </div>
                <div className="min-w-0">
                  <p className="m-0 text-[13px] font-semibold truncate" style={{ color: S.text }}>{user?.email || user?.username}</p>
                  <p className="m-0 text-[12px] truncate" style={{ color: S.textMuted }}>{ROLE_LABELS[role || ''] || 'User'}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => { setUserCard(false); router.push('/settings/business'); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border-0 bg-transparent cursor-pointer text-[13px] font-medium transition-colors duration-150 hover:bg-white/[0.06]"
                  style={{ color: S.text }}
                >
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border-0 bg-transparent cursor-pointer text-[13px] font-medium text-red-400 transition-colors duration-150 hover:bg-red-500/15"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <style>{`
        .ims-sidebar { overscroll-behavior: contain; }

        /* Pin control takes no horizontal space until it is actually shown, so the
           label gets the full remaining width instead of budgeting around it. */
        .ims-pin {
          width: 0;
          opacity: 0;
          transition: width 150ms ease, opacity 150ms ease;
        }
        .ims-row:hover .ims-pin,
        .ims-pin:focus-visible,
        .ims-pin.is-pinned {
          width: 24px;
          opacity: 1;
        }

        /* Logo doubles as the expand target when collapsed */
        .ims-logo-btn {
          transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 200ms ease;
        }
        .ims-logo-btn:hover {
          transform: scale(1.06);
          box-shadow: 0 4px 14px rgba(0,166,166,0.35);
        }
        .ims-logo-btn:active { transform: scale(0.95); }
        .ims-logo-btn:focus-visible { box-shadow: 0 0 0 3px rgba(0,166,166,0.45); }

        /* ---- Collapse / expand motion --------------------------------
           One curve, one duration, both directions — so opening feels
           identical to closing rather than snapping open. */
        .ims-width-tween {
          transition:
            width 260ms cubic-bezier(0.4, 0, 0.2, 1),
            min-width 260ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Labels mount on expand. Fading them in just behind the width lets
           the panel lead and the content settle, instead of text popping in
           at full opacity while the sidebar is still 72px wide. */
        @keyframes imsReveal {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .ims-reveal { animation: imsReveal 200ms cubic-bezier(0.4, 0, 0.2, 1) 110ms both; }

        /* ---- Collapse control ----------------------------------------
           Restraint over volume: a translucent disc with a hairline ring
           and a lit top edge, rather than a solid teal fill competing with
           the logo. It only asserts itself on hover. */
        .ims-collapse {
          width: 38px;
          height: 38px;
          color: rgba(244,247,247,0.55);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%);
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,0.09),
            inset 0 1px 0 0 rgba(255,255,255,0.10),
            0 1px 2px rgba(0,0,0,0.35);
          transition: color 200ms ease, background 200ms ease,
                      box-shadow 200ms ease, transform 160ms ease;
        }
        .ims-collapse:hover {
          color: #FFFFFF;
          background:
            linear-gradient(180deg, rgba(0,166,166,0.30) 0%, rgba(0,166,166,0.14) 100%);
          box-shadow:
            inset 0 0 0 1px rgba(0,166,166,0.55),
            inset 0 1px 0 0 rgba(255,255,255,0.18),
            0 4px 14px rgba(0,166,166,0.28);
        }
        .ims-collapse:active { transform: scale(0.94); }
        .ims-collapse:focus-visible {
          box-shadow:
            inset 0 0 0 1px rgba(0,166,166,0.55),
            0 0 0 3px rgba(0,166,166,0.35);
        }

        /* Specular highlight across the top third of the disc */
        .ims-collapse-sheen {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: radial-gradient(120% 80% at 50% -20%, rgba(255,255,255,0.16), transparent 60%);
          pointer-events: none;
        }

        /* Chevron eases toward the direction it will travel */
        .ims-collapse-chevron { transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1); }
        .ims-collapse:hover .ims-collapse-chevron { transform: translateX(-1.5px); }
        .ims-collapse:hover .ims-collapse-chevron[style*="180"] { transform: rotate(180deg) translateX(-1.5px); }
        .ims-row { position: relative; overflow: hidden; }
        .ims-row:hover:not(.is-active) { background: ${S.hover} !important; }
        .ims-row:hover:not(.is-active) span { color: ${S.text}; }

        .ims-sidebar-scroll::-webkit-scrollbar { width: 5px; }
        .ims-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .ims-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.10);
          border-radius: 10px;
        }
        .ims-sidebar-scroll:hover::-webkit-scrollbar-thumb { background: rgba(0,166,166,0.35); }
        .ims-sidebar-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.12) transparent; }
      `}</style>

      {/* Collapsed tooltip */}
      {tip && tip.name && (
        <div
          className="fixed z-[1095] pointer-events-none text-[13px] font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-2 border"
          style={{
            left: tip.x, top: tip.y, transform: 'translateY(-50%)',
            background: '#08302E', color: S.text, borderColor: S.hairline,
            boxShadow: '0 12px 30px rgba(0,0,0,.45)',
          }}
        >
          {tip.name}
          {tip.shortcut && (
            <kbd className="text-[9px] font-semibold rounded-md px-1.5 py-0.5 leading-none" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(244,247,247,0.6)' }}>
              Cmd+{tip.shortcut}
            </kbd>
          )}
        </div>
      )}
    </>
  );
}
