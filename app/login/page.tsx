'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Space_Grotesk, Inter } from 'next/font/google';
import { useAuth } from '@/lib/auth-context';
import type { User } from '@/types';
import {
  Eye, EyeOff, Mail, ArrowRight, AlertCircle,
  ShieldCheck, ChevronRight, Pill,
} from '@/components/ui/LucideIcon';
import { AppLoader } from '@/components/ui/Loading';
import { readApiError } from '@/components/auth/AuthShell';
import { ProductsAPI, CategoriesAPI, TransactionsAPI, InvoicesAPI, BatchesAPI } from '@/lib/api';
import { setDashboardBootData, clearDashboardBootData } from '@/lib/boot-cache';

// The reference template pairs two faces: Space Grotesk 14px/1.5 for body copy,
// and Inter 700 for every heading (h1–h6 all override to Inter).
const grotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });
const inter = Inter({ subsets: ['latin'], weight: ['600', '700'] });

/**
 * Heading scale copied from the reference:
 *   h2 — 28px, dropping to 24px under 992px and 22px under 768px
 *   h1 — 35px, dropping to 28px under 992px and 24px under 768px
 * All at weight 700 in Inter.
 */
const H2 = `${inter.className} font-bold text-[22px] md:text-[24px] min-[992px]:text-[28px]`;
const H1 = `${inter.className} font-bold text-[24px] md:text-[28px] min-[992px]:text-[35px]`;

/** Design tokens lifted from the reference theme. */
const T = {
  primary: '#0F9291',
  primaryHover: '#0C807F',
  gradient: 'linear-gradient(103.28deg, #0EA5A4 0%, #175780 100%)',
  heading: '#101828', // gray-900
  body: '#4A5565',    // gray-600
  border: '#E5E7EB',  // gray-200
  muted: '#6A7282',   // gray-500
};

const demoAccounts = [
  { label: 'Admin', email: 'admin@example.com', password: 'admin123', role: 'Full access' },
];
const showDemoAccounts = process.env.NODE_ENV === 'development';

/**
 * Minimum time the boot panel stays on screen once sign-in starts.
 *
 * This API is fast — auth is ~85ms and the dashboard's three calls total ~24ms —
 * so without a floor the panel would never be perceptible. The window is spent
 * on real work: the dashboard's critical data is prefetched here and handed
 * over, so the dashboard paints with data instead of skeletons. Sits inside the
 * 300–1200ms target band.
 */
const MIN_BOOT_MS = 900;

/** After this long, tell the user it's slow rather than leaving them guessing. */
const SLOW_AFTER_MS = 2500;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [remember, setRemember] = useState(false);

  // Boot state — driven by real work, never by a timer.
  const [booting, setBooting] = useState(false);
  const [bootVisible, setBootVisible] = useState(false);
  const [slow, setSlow] = useState(false);
  const [bootUser, setBootUser] = useState<User | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [bootError, setBootError] = useState<{ title: string; message: string; expired?: boolean } | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { login } = useAuth();
  const router = useRouter();

  const STAGE_LABELS = ['Verifying credentials', 'Loading your profile', 'Loading inventory data', 'Opening workspace'];
  const stages = STAGE_LABELS.map((label, i) => ({
    id: label,
    label,
    state: (i < stageIndex ? 'done' : i === stageIndex ? 'active' : 'pending') as 'pending' | 'active' | 'done',
  }));

  /**
   * Dev-only inspection hook. Sign-in completes in well under the reveal
   * threshold on a healthy setup, so the boot panel correctly never appears —
   * which also makes it impossible to review. These let you see each state:
   *   /login?boot          loading
   *   /login?boot=slow     slow-network copy
   *   /login?boot=error    initialisation failure
   *   /login?boot=expired  expired session
   */
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const mode = new URLSearchParams(window.location.search).get('boot');
    if (mode === null) return;

    setPreview(mode || 'loading');
    setBootUser({ id: '1', username: 'Admin', email: 'admin@example.com', role: 'admin' });
    setStageIndex(1);

    if (mode === 'error') {
      setBootError({
        title: 'Unable to load your workspace',
        message: 'Something went wrong while preparing the application.',
      });
    } else if (mode === 'expired') {
      setBootError({
        title: 'Your session has expired',
        message: 'Sign in again to continue where you left off.',
        expired: true,
      });
    } else {
      setBooting(true);
      setBootVisible(true);
      if (mode === 'slow') setSlow(true);
    }
  }, []);

  // "Remember for 30 days" prefills the address next visit. The session length
  // itself is server-controlled, so the checkbox only claims what it can deliver.
  useEffect(() => {
    const saved = localStorage.getItem('rememberedEmail');
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
    emailRef.current?.focus();
  }, []);

  // Only reveal the boot panel if the work is actually slow enough to warrant it,
  // and only escalate to the "still working" copy well after that.
  useEffect(() => {
    if (preview) return; // preview states are pinned, not timed
    if (!booting) {
      setBootVisible(false);
      setSlow(false);
      return;
    }
    setBootVisible(true);
    const nag = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(nag);
  }, [booting, preview]);

  useEffect(() => {
    if (error && formRef.current) {
      formRef.current.classList.remove('animate-shake');
      void formRef.current.offsetWidth;
      formRef.current.classList.add('animate-shake');
    }
  }, [error]);

  const syncCapsLock = (e: React.KeyboardEvent | React.MouseEvent) => {
    setCapsLock(e.getModifierState?.('CapsLock') ?? false);
  };

  const runSignIn = async () => {
    const startedAt = Date.now();
    setError('');
    setBootError(null);
    setIsLoading(true);
    setBooting(true);
    setStageIndex(0);

    let signedIn: User;
    try {
      // Stage 1 — the only network round trip on this path.
      signedIn = await login(email, password);
    } catch (err) {
      const detail = readApiError(err, 'Sign in failed. Please try again.');
      setBooting(false);
      setIsLoading(false);
      setError(
        /not found|does not match|invalid/i.test(detail)
          ? 'Incorrect email or password.'
          : detail
      );
      return;
    }

    // Stage 2 — session. The profile arrives inside the login response, so
    // there is no second /users/current round trip.
    setBootUser(signedIn);
    setStageIndex(1);

    if (remember) localStorage.setItem('rememberedEmail', email);
    else localStorage.removeItem('rememberedEmail');

    if (!signedIn?.role) {
      setBootError({
        title: 'Unable to load your workspace',
        message: 'Your account signed in but no role was returned, so we could not open the dashboard.',
      });
      return;
    }

    // Stage 3 — warm the dashboard here so it paints with data on arrival.
    setStageIndex(2);
    try {
      const [prodRes, catRes, txRes, invRes, batchRes] = await Promise.all([
        ProductsAPI.getAll(),
        CategoriesAPI.getAll(),
        TransactionsAPI.getAll().catch(() => ({ data: [] })),
        InvoicesAPI.getAll().catch(() => ({ data: [] })),
        BatchesAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setDashboardBootData({
        products: prodRes.data || [],
        categories: catRes.data || [],
        transactions: txRes.data || [],
        invoices: invRes.data || [],
        batches: batchRes.data || [],
      });
    } catch {
      // Non-fatal: the dashboard will fetch for itself and show skeletons.
      clearDashboardBootData();
    }

    // Hold only for whatever is left of the minimum window — never a fixed wait
    // stacked on top of the work already done.
    const remaining = MIN_BOOT_MS - (Date.now() - startedAt);
    if (remaining > 0) await new Promise(r => setTimeout(r, remaining));

    setStageIndex(3);
    router.push('/dashboard');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void runSignIn();
  };

  /* ===================== BOOT ===================== */
  // Rendered only when sign-in is slow enough to need feedback, or when it failed.
  if ((booting && bootVisible) || bootError) {
    return (
      <AppLoader
        stages={stages}
        userName={bootUser?.username}
        slow={slow}
        error={bootError}
        onRetry={() => void runSignIn()}
        onSignOut={() => {
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
          setBooting(false);
          setBootError(null);
          setIsLoading(false);
        }}
      />
    );
  }


  /* ===================== SIGN IN ===================== */
  const fieldWrap = 'flex items-stretch w-full rounded-[5px] border overflow-hidden transition-colors duration-150 bg-white';
  const fieldInput = 'flex-1 min-w-0 h-[42px] px-3 text-[14px] text-[#101828] placeholder:text-[#99A1AF] bg-transparent outline-none';
  const fieldAddon = 'flex items-center justify-center w-[42px] shrink-0 border-l text-[#6A7282]';

  return (
    <div className={`${grotesk.className} min-h-screen bg-white`} style={{ color: T.body }}>
      <div className="flex flex-wrap min-h-screen">

        {/* ============ LEFT — FORM (col-lg-8) ============ */}
        <div className="w-full lg:w-2/3 p-3">
          <div className="flex items-center justify-center min-h-screen py-5">
            <div className="w-full max-w-[450px] mx-auto px-2">
              <form ref={formRef} onSubmit={handleSubmit} noValidate className="relative pt-14 text-center">

                {/* Logo — absolutely centred at the top, as in the reference */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 flex items-center gap-2">
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: T.gradient }}>
                    <Pill className="w-[18px] h-[18px] text-white" />
                  </span>
                  <span className={`${inter.className} text-[17px] font-bold tracking-tight`} style={{ color: T.heading }}>
                    Inventory<span style={{ color: T.primary }}>MS</span>
                  </span>
                </div>

                <div className="mb-6">
                  <h2 className={`${H2} mb-2 leading-[1.3]`} style={{ color: T.heading }}>
                    Sign In To Your Account
                  </h2>
                  <p className="text-[14px] leading-relaxed mb-0" style={{ color: T.body }}>
                    Access real-time insights into inventory, POS transactions, supplier orders, and prescription workflows.
                  </p>
                </div>

                {/* Email */}
                <div className="mb-2 text-start">
                  <label htmlFor="email" className="block text-[14px] font-semibold mb-[6px]" style={{ color: T.heading }}>
                    Email Address<span className="text-[#D42314]"> *</span>
                  </label>
                  <div className={fieldWrap} style={{ borderColor: error ? '#D42314' : T.border }}>
                    <input
                      id="email" ref={emailRef} type="email" required autoComplete="email"
                      value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="Enter Email address" aria-invalid={!!error}
                      className={fieldInput}
                    />
                    <span className={fieldAddon} style={{ borderColor: T.border }}>
                      <Mail className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                {/* Password */}
                <div className="mb-3 text-start">
                  <label htmlFor="password" className="block text-[14px] font-semibold mb-[6px]" style={{ color: T.heading }}>
                    Password<span className="text-[#D42314]"> *</span>
                  </label>
                  <div className={fieldWrap} style={{ borderColor: error ? '#D42314' : T.border }}>
                    <input
                      id="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                      value={password} onChange={e => setPassword(e.target.value)}
                      onKeyUp={syncCapsLock} onKeyDown={syncCapsLock} onClick={syncCapsLock}
                      onBlur={() => setCapsLock(false)}
                      placeholder="Enter Password" aria-invalid={!!error}
                      aria-describedby={capsLock ? 'capslock-hint' : undefined}
                      className={fieldInput}
                    />
                    <button
                      type="button" onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}
                      className={`${fieldAddon} hover:text-[#101828] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9291]/40`}
                      style={{ borderColor: T.border }}
                    >
                      {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                  {capsLock && (
                    <p id="capslock-hint" className="text-[#D97F06] text-[12px] mt-1.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Caps Lock is on
                    </p>
                  )}
                </div>

                {/* Remember / Forgot */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <label htmlFor="remember_me" className="flex items-center gap-2 cursor-pointer select-none text-start">
                    <input
                      id="remember_me" type="checkbox" checked={remember}
                      onChange={e => setRemember(e.target.checked)}
                      className="w-4 h-4 rounded-[3px] cursor-pointer accent-[#0F9291]"
                    />
                    <span className="text-[14px]" style={{ color: T.heading }}>Remember for 30 days</span>
                  </label>
                  <a href="/login" className="text-[14px] font-medium hover:underline" style={{ color: T.primary }}>
                    Forgot Password?
                  </a>
                </div>

                {/* Error */}
                <div aria-live="polite" aria-atomic="true">
                  {error && (
                    <div className="flex items-start gap-2 px-3.5 py-3 rounded-[5px] text-[13px] mb-4 text-start"
                      style={{ background: '#FDECEA', border: '1px solid #F6C9C4', color: '#A8201A' }}>
                      <AlertCircle className="w-4 h-4 shrink-0 mt-[1px]" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="mb-4">
                  <button
                    type="submit" disabled={isLoading}
                    className="w-full h-[44px] rounded-[5px] text-white text-[15px] font-semibold flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9291]/50 focus-visible:ring-offset-2"
                    style={{ background: T.gradient, backgroundSize: '200% auto' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundPosition = 'right center')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundPosition = 'left center')}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Signing In
                      </>
                    ) : (
                      <>Sign In <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>

                {/* Sign up */}
                <div className="text-center mt-4">
                  <p className="text-[14px] font-normal mb-0" style={{ color: T.heading }}>
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="font-medium hover:underline" style={{ color: T.primary }}>Sign up</Link>
                  </p>
                </div>

                {showDemoAccounts && (
                  <div className="mt-7 pt-5 border-t text-start" style={{ borderColor: T.border }}>
                    <p className="text-[11px] uppercase tracking-wider font-semibold mb-3" style={{ color: T.muted }}>
                      Development only
                    </p>
                    <div className="flex flex-col gap-2">
                      {demoAccounts.map(acc => (
                        <button
                          key={acc.email} type="button"
                          onClick={() => { setEmail(acc.email); setPassword(acc.password); setError(''); }}
                          className="flex items-center gap-3 px-3.5 py-2.5 rounded-[5px] border bg-white hover:bg-gray-50 transition-colors text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9291]/40"
                          style={{ borderColor: T.border }}
                        >
                          <span className="w-9 h-9 rounded-[5px] flex items-center justify-center shrink-0" style={{ background: T.gradient }}>
                            <span className="text-white text-xs font-bold">{acc.label.charAt(0)}</span>
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-[14px] font-semibold" style={{ color: T.heading }}>{acc.label}</span>
                            <span className="block text-[11px]" style={{ color: T.muted }}>{acc.role}</span>
                          </span>
                          <ChevronRight className="w-4 h-4 text-[#D1D5DC] group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* ============ RIGHT — HERO (col-lg-4) ============ */}
        <div className="hidden lg:flex lg:w-1/3 p-0">
          <div className="relative w-full h-screen overflow-hidden">
            <Image
              src="/auth/auth-bg.jpg" alt="" fill priority
              className="object-cover object-center" sizes="33vw"
            />
            {/* Decorative gradient washes, top-right then bottom-right */}
            <Image
              src="/auth/authentication-bg-01.png" alt="" width={640} height={200}
              className="absolute top-0 right-0 w-full h-auto pointer-events-none select-none" aria-hidden="true"
            />
            <Image
              src="/auth/authentication-bg-02.png" alt="" width={640} height={200}
              className="absolute bottom-0 right-0 w-full h-auto pointer-events-none select-none" aria-hidden="true"
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
              <div className="text-center z-[2]">
                <h1 className={`${H1} text-white leading-tight mb-2 px-3`}>
                  Smart Pharmacy Control Panel
                </h1>
                <p className="text-white text-[14px] leading-relaxed mb-0">
                  Get real time insights into sales performance, stock levels, prescriptions, and staff efficiency with intelligent analytics.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
