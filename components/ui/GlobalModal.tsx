'use client';

import { useEffect, useRef, useState, useCallback, type ReactNode, type RefObject } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

/* ════════════════════════════════════════════════════════════════════
   GlobalModal — premium enterprise ERP dialog, shared across every page.

   • Glass overlay that blurs the ENTIRE application (sidebar, navbar,
     tables, charts) with backdrop-blur(18px) — no dark black overlay.
   • Centered, spring scale 0.95→1 + fade, 220ms open / 180ms close.
   • Sizes: mobile 95%, tablet 560px, desktop 620px (max 680px).
   • Focus trap, ESC to close, Enter submits, auto-focus first control,
     restores focus, locks page scroll, blocks background clicks.
   • Header with rounded coloured icon tile + large bold title.
   • Scrollable body with 24px rhythm + sticky footer.
   ════════════════════════════════════════════════════════════════════ */

export const modalInputCls =
  'w-full h-14 px-4 text-[15px] rounded-xl border bg-white dark:bg-[#171717] text-gray-900 dark:text-[#F8FAFC] ' +
  'placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-4 transition-all duration-200 ' +
  'border-gray-200 dark:border-[#2A2A2A] hover:border-gray-300 dark:hover:border-[#3A3A3A] ' +
  'focus:border-[#0F9291] focus:ring-[#0F9291]/10';

export const modalSelectCls = `${modalInputCls} appearance-none pr-10 cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2214%22%20height=%2214%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%2394a3b8%22%20stroke-width=%222.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Cpath%20d=%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_16px_center]`;

export const modalLabelCls =
  'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2';

export const modalHintCls =
  'mt-1.5 text-xs text-gray-400 dark:text-gray-500';

const SIZE_CLASSES: Record<string, string> = {
  sm: 'w-[95%] sm:w-[480px]',
  md: 'w-[95%] sm:w-[560px] lg:w-[620px] lg:max-w-[680px]',
  lg: 'w-[95%] sm:w-[720px] lg:max-w-[760px]',
  xl: 'w-[95%] sm:w-[820px] lg:w-[920px]',
};

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

interface GlobalModalProps {
  /** If omitted, the modal is visible whenever it is mounted. */
  open?: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  iconTileClass?: string;
  /** sm (confirm) | md (default) | lg | xl */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  /** Custom footer. If omitted, a Cancel + Primary footer is rendered. */
  footer?: ReactNode;
  formId?: string;
  submitLabel?: string;
  onSubmit?: () => void;
  submitting?: boolean;
  submitDisabled?: boolean;
  danger?: boolean;
  cancelLabel?: string;
  hideFooter?: boolean;
  onBackdropClose?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  bodyClassName?: string;
  closeOnEscape?: boolean;
  /**
   * When false the popup never shows an internal scrollbar — the layout
   * must fit naturally. On screens < 640px the browser page may scroll.
   * Defaults to true (scrollable body).
   */
  scrollable?: boolean;
}

export default function GlobalModal({
  open = true,
  onClose,
  title,
  subtitle,
  icon,
  iconTileClass,
  size = 'md',
  children,
  footer,
  formId,
  submitLabel = 'Save',
  onSubmit,
  submitting = false,
  submitDisabled = false,
  danger = false,
  cancelLabel = 'Cancel',
  hideFooter = false,
onBackdropClose = true,
  initialFocusRef,
  bodyClassName,
  closeOnEscape = true,
  scrollable = true,
}: GlobalModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClose = useCallback(() => {
    if (submitting) return;
    onClose();
  }, [onClose, submitting]);

  /* Animate in when opened */
  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
  }, [open]);

  /* Scroll lock + restore focus */
  useEffect(() => {
    if (!open) return () => {};
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      restoreFocusRef.current?.focus?.();
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [open]);

  /* Auto-focus first input after open animation starts */
  useEffect(() => {
    if (!open || !shown) return;
    const t = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }
      const panel = panelRef.current;
      if (!panel) return;
      const inputs = Array.from(panel.querySelectorAll<HTMLElement>('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, textarea')).filter(el => el.offsetParent !== null);
      const first = inputs[0] ?? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))[0];
      first?.focus();
    }, 60);
    return () => clearTimeout(t);
  }, [open, shown, initialFocusRef]);

  const closeWithAnimation = useCallback(() => {
    if (closing || submitting) return;
    setClosing(true);
    closeTimer.current = setTimeout(() => onClose(), 180);
  }, [closing, submitting, onClose]);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (closeOnEscape) {
        e.preventDefault();
        e.stopPropagation();
        closeWithAnimation();
      }
      return;
    }
    const tag = (e.target as HTMLElement)?.tagName;
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement)?.isContentEditable;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (e.key === '/' && !typing) {
      e.preventDefault();
      return;
    }
    if (e.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(el => el.offsetParent !== null);
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey) {
      if (active === first || !panel.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last || !panel.contains(active)) {
      e.preventDefault();
      first.focus();
    }
  }, [closeWithAnimation, closeOnEscape]);

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onKeyDown]);

  useEffect(() => {
    if (!open) setClosing(false);
  }, [open]);

  if (!open && !closing) return null;

  const overlayOpened = open && !closing;
  const panelOpened = open && !closing && shown;

  return (
    <div
      className={`fixed inset-0 z-[1100] flex p-3 sm:p-6 ${
        scrollable
          ? 'items-center justify-center'
          : 'min-h-full items-start sm:items-center justify-center overflow-y-auto sm:overflow-hidden'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* ── Frosted glass overlay (pure white frost, no dark veil) ── */}
      <div
        aria-hidden
        onClick={() => onBackdropClose && !submitting && closeWithAnimation()}
        className={`absolute inset-0 left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-[200vh] w-[200vw] bg-[rgba(255,255,255,0.18)] dark:bg-[rgba(15,23,42,0.28)] transition-[opacity,backdrop-filter] duration-[220ms] ease-out ${
          overlayOpened ? 'opacity-100 backdrop-blur-[20px]' : 'opacity-0 backdrop-blur-0'
        }`}
      />

      {/* ── Floating panel ── */}
      <div
        ref={panelRef}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className={`relative flex flex-col overflow-hidden rounded-[24px] bg-white dark:bg-[#171717] border border-white/50 dark:border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.18)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.7)] ${
          SIZE_CLASSES[size]
        } ${
          scrollable ? 'max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-48px)]' : 'my-auto sm:my-0'
        } transition-[opacity,transform] ease-out ${
          closing ? 'duration-[180ms]' : 'duration-[220ms]'
        } ${panelOpened ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.95] translate-y-2'}`}
      >
        {/* ── Header ── */}
        <header className="shrink-0 flex items-center gap-4 px-6 sm:px-8 pt-6 sm:pt-7 pb-5">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${
              iconTileClass ?? 'bg-gradient-to-br from-[#0F9291] to-teal-600 text-white shadow-lg shadow-[#0F9291]/25'
            }`}
          >
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <h2 ref={titleRef} className="text-lg font-bold text-gray-900 dark:text-[#F8FAFC] leading-tight truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => !submitting && closeWithAnimation()}
            aria-label="Close dialog"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-600 dark:hover:text-gray-200 hover:rotate-90 transition-all duration-200 active:scale-90"
          >
            <XIcon />
          </button>
        </header>

        {/* ── Body (never scrolls when scrollable=false — page scrolls instead on <sm) ── */}
        <div className={`flex-1 ${scrollable ? 'overflow-y-auto pb-2 [scrollbar-width:thin]' : 'overflow-visible'} px-6 sm:px-8 ${bodyClassName}`}>
          {children}
        </div>

        {/* ── Sticky footer ── */}
        {!hideFooter && (
          <footer className="shrink-0 flex items-center gap-2.5 px-6 sm:px-8 py-4 sm:py-5 border-t border-gray-100 dark:border-white/[0.06] bg-white/80 dark:bg-[#171717]/80 backdrop-blur-xl">
            {footer ?? (
              <>
                <button
                  type="button"
                  onClick={() => !submitting && closeWithAnimation()}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1F1F1F] ring-1 ring-gray-200 dark:ring-[#2A2A2A] hover:bg-gray-50 dark:hover:bg-[#232323] disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  <XIcon /> {cancelLabel}
                </button>
                <div className="flex-1" />
                <button
                  type="submit"
                  form={formId}
                  onClick={formId ? undefined : onSubmit}
                  disabled={submitting || submitDisabled}
                  className={`inline-flex items-center gap-2 h-11 px-5 rounded-xl text-white text-sm font-bold shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 ${
                    danger
                      ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/25 hover:shadow-red-500/40'
                      : 'bg-gradient-to-r from-[#0F9291] to-teal-600 shadow-[#0F9291]/25 hover:shadow-[#0F9291]/35'
                  }`}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {submitting ? 'Saving…' : submitLabel}
                </button>
              </>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════
   GlobalConfirmModal — shared danger/success confirmation dialog
   ════════════════════════════════════════════════════════════════════ */

interface GlobalConfirmModalProps {
  open?: boolean;
  onClose: () => void;
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
  submitting?: boolean;
  danger?: boolean;
  children?: ReactNode;
}

export function GlobalConfirmModal({
  open,
  onClose,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  submitting = false,
  danger = true,
  children,
}: GlobalConfirmModalProps) {
  return (
    <GlobalModal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      submitLabel={confirmLabel}
      onSubmit={onConfirm}
      submitting={submitting}
      danger={danger}
      icon={
        <AlertTriangle className={`w-5 h-5 ${danger ? 'text-white' : 'text-[#0F9291]'}`} />
      }
      iconTileClass={
        danger
          ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25'
          : 'bg-gradient-to-br from-[#0F9291] to-teal-600 text-white shadow-lg shadow-[#0F9291]/25'
      }
    >
      {message != null && (
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed pb-2">{message}</p>
      )}
      {children}
    </GlobalModal>
  );
}