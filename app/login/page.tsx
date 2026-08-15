'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import type { User } from '@/types';
import {
  Eye, EyeOff, Mail, ArrowRight, AlertCircle,
  CheckCircle2, Pill, ShieldCheck, ChevronRight,
} from '@/components/ui/LucideIcon';

/**
 * Only shown in development. These must match what config/DataInitializer.java
 * actually seeds — listing accounts that do not exist just hands the user a
 * credential that 404s.
 */
const demoAccounts = [
  { label: 'Admin', email: 'admin@example.com', password: 'admin123', role: 'Full access', color: 'from-[#0F9291] to-teal-600' },
];

const showDemoAccounts = process.env.NODE_ENV === 'development';

/**
 * How long the welcome screen stays up before the dashboard loads.
 * The entrance choreography runs to ~900ms, so anything below ~1800ms cuts it off.
 */
const WELCOME_MS = 2400;

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  pharmacist: 'Pharmacist',
  cashier: 'Cashier',
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState<User | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Hold the welcome screen briefly, then hand off to the dashboard.
  useEffect(() => {
    if (!welcomeUser) return;
    const timer = setTimeout(() => router.push('/dashboard'), WELCOME_MS);
    return () => clearTimeout(timer);
  }, [welcomeUser, router]);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const signedIn = await login(email, password);
      setWelcomeUser(signedIn);
    } catch (err) {
      // Surface what the server actually said. Collapsing everything into
      // "invalid credentials" hid outages and validation errors alike.
      const raw = err instanceof Error ? err.message : '';
      let detail = '';
      try {
        detail = JSON.parse(raw)?.message ?? '';
      } catch {
        detail = raw;
      }

      if (/failed to fetch|networkerror|load failed/i.test(detail)) {
        setError("Can't reach the server. Check that the API is running on port 5050.");
      } else if (/not found|does not match|invalid/i.test(detail)) {
        setError('Incorrect email or password.');
      } else {
        setError(detail || 'Sign in failed. Please try again.');
      }
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  const fieldClass =
    'w-full h-11 pl-4 pr-11 text-sm rounded-lg border outline-none transition-colors duration-150 ' +
    'text-gray-900 bg-white border-gray-300 placeholder:text-gray-400 ' +
    'hover:border-gray-400 focus:border-[#0F9291] focus:ring-2 focus:ring-[#0F9291]/25 ' +
    'dark:text-gray-100 dark:bg-white/[0.04] dark:border-white/10 dark:placeholder:text-gray-500 ' +
    'dark:hover:border-white/20 dark:focus:border-[#2CB8B5] dark:focus:ring-[#2CB8B5]/25';

  if (welcomeUser) {
    const displayName = (welcomeUser.username || '').trim();
    const firstName = displayName.split(' ')[0] || 'there';
    const initial = (displayName[0] || '?').toUpperCase();

    return (
      <div
        className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'radial-gradient(120% 90% at 50% 0%, #10403F 0%, #0A1E1E 45%, #050F0F 100%)' }}
        role="status"
        aria-live="polite"
      >
        {/* Ambient depth */}
        <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[900px] h-[520px] rounded-full bg-[#0F9291]/10 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-25%] right-[-10%] w-[460px] h-[460px] rounded-full bg-[#0F9291]/[0.07] blur-[110px] pointer-events-none" />

        {/* Drifting motes */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {[
            { l: '18%', d: 0, s: 5 }, { l: '31%', d: 900, s: 3 }, { l: '44%', d: 400, s: 4 },
            { l: '58%', d: 1300, s: 3 }, { l: '69%', d: 200, s: 5 }, { l: '82%', d: 750, s: 4 },
          ].map((m, i) => (
            <span
              key={i}
              className="absolute bottom-[34%] rounded-full bg-[#4FD1CE]"
              style={{
                left: m.l,
                width: `${m.s}px`,
                height: `${m.s}px`,
                animation: `welcomeFloat 2600ms ease-out ${m.d}ms infinite`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Avatar inside a ring that closes as the countdown runs */}
          <div className="relative w-[124px] h-[124px] mb-8">
            <span
              className="absolute inset-3 rounded-full bg-[#0F9291] blur-2xl"
              style={{ animation: 'welcomeHalo 2400ms ease-in-out infinite' }}
            />
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 124 124" aria-hidden="true">
              <circle cx="62" cy="62" r="54" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="3" />
              <circle
                cx="62" cy="62" r="54" fill="none"
                stroke="url(#welcomeStroke)" strokeWidth="3" strokeLinecap="round"
                strokeDasharray="339.292"
                style={{ animation: `welcomeRing ${WELCOME_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards` }}
              />
              <defs>
                <linearGradient id="welcomeStroke" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0F9291" />
                  <stop offset="100%" stopColor="#7FE9E6" />
                </linearGradient>
              </defs>
            </svg>
            <div
              className="absolute inset-[18px] rounded-full bg-gradient-to-br from-[#0F9291] to-teal-700 flex items-center justify-center shadow-xl shadow-[#0F9291]/25"
              style={{ animation: 'welcomePop 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 120ms both' }}
            >
              <span className="text-white text-[32px] font-bold leading-none select-none">{initial}</span>
            </div>
            <span
              className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[#0A1E1E] border-2 border-[#0F9291] flex items-center justify-center"
              style={{ animation: 'welcomePop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) 620ms both' }}
            >
              <CheckCircle2 className="w-4 h-4 text-[#7FE9E6]" />
            </span>
          </div>

          <p className="welcome-rise text-white/45 text-sm tracking-wide mb-2" style={{ animationDelay: '380ms' }}>
            {greeting()},
          </p>

          <h1
            className="welcome-rise welcome-name text-[38px] sm:text-[44px] font-bold leading-[1.1] mb-4 text-balance"
            style={{ animationDelay: '500ms' }}
          >
            {firstName}
          </h1>

          <span
            className="welcome-rise inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0F9291]/12 border border-[#0F9291]/25 text-[#7FE9E6] text-xs font-semibold tracking-wide backdrop-blur-sm"
            style={{ animationDelay: '660ms' }}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {ROLE_LABELS[welcomeUser.role] ?? welcomeUser.role}
          </span>

          <p className="welcome-rise text-white/35 text-[13px] mt-10" style={{ animationDelay: '900ms' }}>
            Setting up your workspace…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#0a0a0f]">
      {/* ===== LEFT: SIGN-IN FORM ===== */}
      <div className="flex-1 lg:w-[55%] flex items-center justify-center px-5 py-10">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="w-full max-w-[420px]"
          noValidate
        >
          {/* Brand */}
          <div className="flex items-center gap-2.5 mb-9">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F9291] to-teal-600 flex items-center justify-center shadow-sm shrink-0">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-[15px] font-bold text-gray-900 dark:text-white">Inventory</p>
              <p className="text-[12px] font-medium text-gray-500 dark:text-gray-400">Management System</p>
            </div>
          </div>

          <h1 className="text-[27px] font-bold text-gray-900 dark:text-white leading-tight mb-2 text-balance">
            Sign in to your account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
            Manage stock, dispensing, suppliers and daily sales from one place.
          </p>

          {/* Email */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email address
            </label>
            <div className="relative">
              <input
                id="email"
                ref={emailRef}
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@pharmacy.com"
                aria-invalid={!!error}
                className={fieldClass}
              />
              <Mail className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Password */}
          <div className="mb-5">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyUp={syncCapsLock}
                onKeyDown={syncCapsLock}
                onClick={syncCapsLock}
                onBlur={() => setCapsLock(false)}
                placeholder="Enter your password"
                aria-invalid={!!error}
                aria-describedby={capsLock ? 'capslock-hint' : undefined}
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 -m-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9291]/40 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {capsLock && (
              <p id="capslock-hint" className="text-amber-600 dark:text-amber-400 text-xs mt-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                Caps Lock is on
              </p>
            )}
          </div>

          {/* Status — one live region so screen readers announce both outcomes */}
          <div aria-live="polite" aria-atomic="true">
            {error && (
              <div className="flex items-start gap-2 px-3.5 py-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm mb-4 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !!welcomeUser}
            className="w-full h-11 rounded-lg bg-gradient-to-r from-[#0F9291] to-[#0D7F7E] text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-all duration-150 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9291]/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a0a0f] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in…
              </>
            ) : (
              <>Sign in <ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          {showDemoAccounts && (
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/[0.06]">
              <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium mb-3">
                Development only
              </p>
              <div className="flex flex-col gap-2">
                {demoAccounts.map(acc => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillDemo(acc.email, acc.password)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 dark:bg-white/[0.03] dark:border-white/10 dark:hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9291]/40 transition-colors text-left group"
                  >
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${acc.color} flex items-center justify-center shrink-0 shadow-sm`}>
                      <span className="text-white text-xs font-bold">{acc.label.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{acc.label}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{acc.role}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>

      {/* ===== RIGHT: BRAND PANEL ===== */}
      <div
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0A1E1E 0%, #061414 100%)' }}
        aria-hidden="true"
      >
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-[#0F9291]/10 blur-[90px]" />
        <div className="absolute -bottom-24 -left-24 w-[320px] h-[320px] rounded-full bg-[#0F9291]/5 blur-[70px]" />

        <div className="relative z-10 w-full flex flex-col items-center justify-center px-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#0F9291]/20 backdrop-blur-sm flex items-center justify-center mb-7 border border-[#0F9291]/20">
            <Pill className="w-8 h-8 text-[#0F9291]" />
          </div>
          <p className="text-white text-[30px] font-bold leading-tight mb-4 max-w-sm text-balance">
            Smart pharmacy control panel
          </p>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Real-time visibility into stock levels, expiring batches, dispensing and daily sales.
          </p>
        </div>
      </div>
    </div>
  );
}
