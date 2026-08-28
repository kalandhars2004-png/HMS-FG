'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import GlobalLoader from './GlobalLoader';
import { registerLoaderBridge } from './loader-bridge';
import { LoaderShowInput, resolveLoaderMessage } from './loader-types';

interface GlobalLoaderContextValue {
  showLoader: (input?: LoaderShowInput) => void;
  hideLoader: () => void;
  hideAllLoaders: () => void;
  setLoaderMessage: (message: string) => void;
}

const GlobalLoaderContext = createContext<GlobalLoaderContextValue | null>(null);

// Don't show for operations that finish quickly — prevents flashing.
const SHOW_DELAY_MS = 120;
// Once visible, keep it up at least this long so it never blinks.
const MIN_VISIBLE_MS = 220;
// Exit fade duration — keep mounted this long after hiding.
const EXIT_FADE_MS = 150;

export function GlobalLoaderProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState('');
  const pathname = usePathname();

  const countRef = useRef(0);
  const shownAtRef = useRef(0);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (showTimerRef.current) { clearTimeout(showTimerRef.current); showTimerRef.current = null; }
    if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
    if (unmountTimerRef.current) { clearTimeout(unmountTimerRef.current); unmountTimerRef.current = null; }
  };

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) return;
    // A pending show timer means the overlay never became visible — just cancel it.
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
      return;
    }
    if (!visible) return;
    const elapsed = Date.now() - shownAtRef.current;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      setVisible(false);
      unmountTimerRef.current = setTimeout(() => {
        unmountTimerRef.current = null;
        setMounted(false);
      }, EXIT_FADE_MS);
    }, wait);
  }, [visible]);

  const showLoader = useCallback((input?: LoaderShowInput) => {
    countRef.current += 1;
    const msg = resolveLoaderMessage(input);
    setMessage(msg);
    // A new operation arrived during exit/hidden phases — stay or re-enter smoothly.
    if (unmountTimerRef.current) { clearTimeout(unmountTimerRef.current); unmountTimerRef.current = null; }
    if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
    if (!visible && !showTimerRef.current && !mounted) {
      setMounted(true);
    }
    if (!visible && !showTimerRef.current) {
      showTimerRef.current = setTimeout(() => {
        showTimerRef.current = null;
        shownAtRef.current = Date.now();
        setVisible(true);
      }, SHOW_DELAY_MS);
    }
  }, [visible, mounted]);

  const hideLoader = useCallback(() => {
    countRef.current = Math.max(0, countRef.current - 1);
    if (countRef.current === 0) scheduleHide();
  }, [scheduleHide]);

  const hideAllLoaders = useCallback(() => {
    countRef.current = 0;
    scheduleHide();
  }, [scheduleHide]);

  const setLoaderMessage = useCallback((msg: string) => {
    setMessage(msg);
  }, []);

  useEffect(() => {
    // Bridge for non-React callers (ApiClient).
    registerLoaderBridge({ begin: () => showLoader(), end: () => hideLoader() });
    return () => registerLoaderBridge(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep latest callbacks in the bridge after re-renders.
  useEffect(() => {
    registerLoaderBridge({ begin: () => showLoader(), end: () => hideLoader() });
  }, [showLoader, hideLoader]);

  useEffect(() => () => clearTimers(), []);

  // Screen-arrival guarantee: when the route changes, the new screen is here —
  // drop every pending loader immediately so the pulse never outlives the page.
  const lastPathRef = useRef(pathname);
  const hideAllLoadersNow = useCallback(() => {
    countRef.current = 0;
    if (showTimerRef.current) { clearTimeout(showTimerRef.current); showTimerRef.current = null; }
    if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
    setVisible(false);
    unmountTimerRef.current = setTimeout(() => {
      unmountTimerRef.current = null;
      setMounted(false);
    }, EXIT_FADE_MS);
  }, []);
  useEffect(() => {
    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname;
      hideAllLoadersNow();
    }
  }, [pathname, hideAllLoadersNow]);

  return (
    <GlobalLoaderContext.Provider value={{ showLoader, hideLoader, hideAllLoaders, setLoaderMessage }}>
      {children}
      {mounted && <GlobalLoader open={visible} message={message} />}
    </GlobalLoaderContext.Provider>
  );
}

export function useGlobalLoader(): GlobalLoaderContextValue {
  const ctx = useContext(GlobalLoaderContext);
  if (!ctx) {
    // Safe no-op fallback so pages outside the provider never crash.
    return {
      showLoader: () => {},
      hideLoader: () => {},
      hideAllLoaders: () => {},
      setLoaderMessage: () => {},
    };
  }
  return ctx;
}
