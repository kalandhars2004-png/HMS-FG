'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Anchored menu rendered through a portal.
 *
 * Table rows live inside `overflow-x-auto` wrappers, and CSS computes the other
 * axis to `auto` whenever one axis is not `visible` — so an absolutely
 * positioned menu gets clipped vertically no matter how high its z-index is.
 * Clipping is not a stacking problem, so the only real fix is to leave the
 * clipping ancestor entirely.
 *
 * Flips above the trigger when there is not enough room below, and clamps to
 * the viewport on both axes.
 */

const MARGIN = 8;

export interface DropdownMenuProps {
  open: boolean;
  onClose: () => void;
  /** The element the menu is positioned against — usually the trigger button. */
  anchorEl: HTMLElement | null;
  children: React.ReactNode;
  width?: number;
  /** Which edge of the anchor to line up with. */
  align?: 'start' | 'end';
}

export default function DropdownMenu({
  open, onClose, anchorEl, children, width = 208, align = 'end',
}: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const place = useCallback(() => {
    if (!anchorEl || !menuRef.current) return;
    const a = anchorEl.getBoundingClientRect();
    const h = menuRef.current.offsetHeight;

    const spaceBelow = window.innerHeight - a.bottom;
    const flipUp = spaceBelow < h + MARGIN && a.top > h + MARGIN;

    let top = flipUp ? a.top - h - 6 : a.bottom + 6;
    top = Math.max(MARGIN, Math.min(top, window.innerHeight - h - MARGIN));

    let left = align === 'end' ? a.right - width : a.left;
    left = Math.max(MARGIN, Math.min(left, window.innerWidth - width - MARGIN));

    setPos({ top, left });
  }, [anchorEl, width, align]);

  // Measure after paint so offsetHeight is real, then keep it pinned.
  useLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;

    const onDocPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t)) return;
      if (anchorEl?.contains(t)) return; // the trigger toggles itself
      onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    // Any scroll would detach the menu from its row, so close rather than chase it.
    const onScroll = () => onClose();

    document.addEventListener('pointerdown', onDocPointer, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', place);

    return () => {
      document.removeEventListener('pointerdown', onDocPointer, true);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', place);
    };
  }, [open, anchorEl, onClose, place]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-[1150] rounded-xl bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#273244]
                 shadow-[0_12px_32px_rgba(16,24,40,0.14)] p-1.5 animate-scaleIn"
      style={{
        width,
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        visibility: pos ? 'visible' : 'hidden',
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

/** A single row inside the menu. */
export function DropdownItem({
  icon, children, onClick, destructive,
}: {
  icon?: React.ReactNode; children: React.ReactNode; onClick: () => void; destructive?: boolean;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-[14px] text-left
                  transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9291]/40 ${
        destructive
          ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/25'
          : 'text-gray-600 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#1F2937] hover:text-gray-900 dark:hover:text-[#F8FAFC]'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 border-t border-gray-100 dark:border-[#273244]" />;
}
