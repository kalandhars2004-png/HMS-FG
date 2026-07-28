'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle,
  CheckCircle2, Building2, Package, Truck, BarChart3,
  Warehouse, Pill, ShieldCheck, ChevronRight,
} from '@/components/ui/LucideIcon';

const demoAccounts = [
  { label: 'Admin', email: 'admin@example.com', password: 'admin123', role: 'Full Access', color: 'from-emerald-500 to-emerald-600' },
  { label: 'Manager', email: 'manager@example.com', password: 'manager123', role: 'Inventory & Reports', color: 'from-blue-500 to-blue-600' },
  { label: 'Store Keeper', email: 'store@example.com', password: 'store123', role: 'Stock Management', color: 'from-amber-500 to-amber-600' },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [remember, setRemember] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const { login } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setChecking(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (error && formRef.current) {
      formRef.current.classList.remove('animate-shake');
      void formRef.current.offsetWidth;
      formRef.current.classList.add('animate-shake');
    }
  }, [error]);

  const handleCapsLock = (e: React.KeyboardEvent) => {
    setCapsLock(e.getModifierState('CapsLock'));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
      setSuccess(true);
    } catch (err) {
      setError('Invalid credentials. Please check your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (email: string, pass: string) => {
    setUsername(email);
    setPassword(pass);
    setError('');
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <Pill className="w-8 h-8 text-white" />
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-100 overflow-hidden position-relative d-block vh-100">
        <div className="flex">
          {/* ===== LEFT: LOGIN FORM ===== */}
          <div className="w-full lg:w-[66.666%] min-h-screen p-3">
            <div className="flex items-center justify-center min-h-screen py-5">
              <div className="w-full max-w-[470px] mx-auto px-4">
                <form onSubmit={handleSubmit}>
                  {/* Logo */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2.5 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F9291] to-teal-600 flex items-center justify-center shadow-sm">
                        <Pill className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xl font-bold text-gray-900 tracking-tight">DreamsPOS</span>
                    </div>
                    <h2 className="text-[28px] font-bold text-gray-900 mb-2 leading-tight">Sign In To Your Account</h2>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                      Access real-time insights into inventory, POS transactions, supplier orders, and prescription workflows.
                    </p>
                  </div>

                  {/* Email */}
                  <div className="mb-3 text-start">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address<span className="text-red-500"> *</span>
                    </label>
                    <div className="relative">
                      <input
                        ref={emailRef}
                        type="email"
                        required
                        autoComplete="email"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Enter Email address"
                        className={`w-full h-11 pl-4 pr-11 text-sm text-gray-900 bg-white border rounded-lg outline-none transition-all duration-200 ${
                          focusedField === 'email' ? 'border-[#0F9291] ring-1 ring-[#0F9291]/20' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <Mail className={`w-4 h-4 transition-colors ${focusedField === 'email' ? 'text-[#0F9291]' : ''}`} />
                      </span>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="mb-3 text-start">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Password<span className="text-red-500"> *</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        onKeyDown={handleCapsLock}
                        placeholder="Enter Password"
                        className={`w-full h-11 pl-4 pr-11 text-sm text-gray-900 bg-white border rounded-lg outline-none transition-all duration-200 ${
                          focusedField === 'password' ? 'border-[#0F9291] ring-1 ring-[#0F9291]/20' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {capsLock && (
                      <p className="text-amber-600 text-xs mt-1 flex items-center gap-1" role="alert">
                        <ShieldCheck className="w-3 h-3" />
                        Caps Lock is on
                      </p>
                    )}
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={e => setRemember(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-[#0F9291] focus:ring-[#0F9291]/30 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">Remember for 30 days</span>
                    </label>
                    <a href="#" className="text-sm font-medium text-[#0F9291] hover:text-[#0D7F7E] hover:underline transition-all">
                      Forgot Password?
                    </a>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm mb-4" role="alert">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Sign In Button */}
                  <div className="mb-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 rounded-lg bg-gradient-to-r from-[#0F9291] to-[#0D7F7E] text-white font-semibold text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <>Sign In <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>

                  {/* Success */}
                  {success && (
                    <div className="flex items-center justify-center gap-2 py-2 text-emerald-600 text-sm font-medium mb-4">
                      <CheckCircle2 className="w-5 h-5" />
                      Login successful — redirecting...
                    </div>
                  )}

                  {/* OR Divider */}
                  <div className="relative mb-4 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <span className="relative bg-white px-3 text-xs text-gray-500">or continue with</span>
                  </div>

                  {/* Google Sign In */}
                  <div className="text-center mb-4">
                    <a href="#" className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Google
                    </a>
                  </div>

                  {/* Sign Up Link */}
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      Don&apos;t have an account?{' '}
                      <a href="#" className="font-medium text-[#0F9291] hover:text-[#0D7F7E] hover:underline">Sign up</a>
                    </p>
                  </div>

                  {/* Demo Accounts */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider text-center font-medium mb-3">Quick Demo Access</p>
                    <div className="flex flex-col gap-2">
                      {demoAccounts.map((acc, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => fillDemo(acc.email, acc.password)}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-left group"
                        >
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${acc.color} flex items-center justify-center shrink-0 shadow-sm`}>
                            <span className="text-white text-xs font-bold">{acc.label.charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{acc.label}</p>
                            <p className="text-[10px] text-gray-400 truncate">{acc.role}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* ===== RIGHT: HERO PANEL ===== */}
          <div className="hidden lg:flex w-[33.333%] min-h-screen relative overflow-hidden">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #0A1E1E 0%, #061414 100%)' }}>
              <div className="absolute bottom-0 right-0 w-full h-full opacity-60" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='100' cy='100' r='80' fill='none' stroke='rgba(255,255,255,0.03)' strokeWidth='1'/%3E%3Ccircle cx='100' cy='100' r='50' fill='none' stroke='rgba(255,255,255,0.03)' strokeWidth='1'/%3E%3C/svg%3E")`,
                backgroundSize: '100% 100%',
              }} />
              <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-[#0F9291]/10 blur-[80px]" />
              <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full bg-[#0F9291]/5 blur-[60px]" />
            </div>
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#0F9291]/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 border border-[#0F9291]/10">
                  <Pill className="w-8 h-8 text-[#0F9291]" />
                </div>
                <h1 className="text-white text-[32px] font-bold leading-tight mb-4 px-4">
                  Smart Pharmacy Control Panel
                </h1>
                <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">
                  Get real time insights into sales performance, stock levels, prescriptions, and staff efficiency with intelligent analytics.
                </p>
              </div>
              <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0F9291]" />
                <span className="w-2 h-2 rounded-full bg-white/20" />
                <span className="w-2 h-2 rounded-full bg-white/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
