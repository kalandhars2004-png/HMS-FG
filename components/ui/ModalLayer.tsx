'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * The application's single modal layer.
 *
 * Everything is portalled to <body>. That is the whole point: `<main>` carries a
 * CSS animation, and an animation creates a stacking context — so a dialog
 * rendered inside it is trapped there and can never paint above the sidebar,
 * no matter how high its z-index goes. Portalling escapes every ancestor
 * context, which is what makes the blur cover the sidebar as well as the content.
 *
 * Responsibilities:
 *   - full-viewport blur + subtle dim
 *   - scroll lock on the page AND on the app's inner scrollers
 *   - pointer isolation (background cannot be clicked)
 *   - Escape to close, focus moved in and trapped, focus restored on close
 */

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Nested modals must not fight over the scroll lock. */
let openCount = 0;

export interface ModalLayerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Set false for flows that must be completed rather than dismissed. */
  dismissOnBackdrop?: boolean;
  dismissOnEscape?: boolean;
  labelledBy?: string;
  describedBy?: string;
  role?: 'dialog' | 'alertdialog';
}

export default function ModalLayer({
  open,
  onClose,
  children,
  dismissOnBackdrop = true,
  dismissOnEscape = true,
  labelledBy,
  describedBy,
  role = 'dialog',
}: ModalLayerProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  /**
   * Callers almost always pass an inline arrow for onClose, so its identity
   * changes on every parent render. Reading it through a ref keeps the setup
   * effect below keyed on `open` alone — depending on the callback directly
   * made the effect tear down and re-run on every keystroke, and its cleanup
   * yanks focus back to the trigger. That is the "type one letter and the
   * field loses focus" bug; never put onClose in that dependency array.
   */
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    restoreFocus.current = document.activeElement as HTMLElement | null;

    // Freeze the page and every inner scroller. `main` and the sidebar have their
    // own overflow-y:auto, so hiding body overflow alone would not stop them.
    openCount += 1;
    document.documentElement.classList.add('ims-modal-open');

    const focusFirst = () => {
      const el = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (el ?? panelRef.current)?.focus();
    };
    const raf = requestAnimationFrame(focusFirst);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissOnEscape) {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;

      // Keep focus inside the dialog so the frozen background stays unreachable.
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) { e.preventDefault(); return; }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener('keydown', onKey, true);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey, true);
      openCount = Math.max(0, openCount - 1);
      if (openCount === 0) document.documentElement.classList.remove('ims-modal-open');
      restoreFocus.current?.focus?.();
    };
  }, [open, dismissOnEscape]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Blur + dim. Deliberately light: the app should stay recognisable behind it. */}
      <div
        className="absolute inset-0 animate-fadeIn"
        style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          background: 'rgba(15, 23, 42, 0.18)',
        }}
        onClick={dismissOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Viewport-centred, independent of sidebar width or content scroll */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div
          ref={panelRef}
          role={role}
          aria-modal="true"
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          // min-h-0 matters: without it a flex child refuses to shrink, and any
          // overflow-y:auto region inside the dialog silently stops scrolling.
          className="pointer-events-auto outline-none max-h-[calc(100vh-32px)] min-h-0 flex"
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
