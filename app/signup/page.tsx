'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Eye, EyeOff, Mail, UserCircle, ArrowRight, ShieldCheck, CheckCircle2,
} from '@/components/ui/LucideIcon';
import {
  AuthShell, AuthLogo, AuthField, FieldIcon, FieldButton, AuthSubmit,
  AuthError, readApiError, T, H2,
} from '@/components/auth/AuthShell';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => { nameRef.current?.focus(); }, []);

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

  const mismatch = confirm.length > 0 && password !== confirm;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      // The API assigns the role itself — it is never taken from the client.
      await AuthAPI.register({ name, email, phoneNumber, password });
    } catch (err) {
      setError(readApiError(err, 'Could not create your account. Please try again.'));
      setIsLoading(false);
      return;
    }

    // Sign the new account straight in so they don't have to retype anything.
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      router.push('/login');
    }
  };

  return (
    <AuthShell>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="relative pt-14 text-center">
        <AuthLogo />

        <div className="mb-6">
          <h2 className={`${H2} mb-2 leading-[1.3]`} style={{ color: T.heading }}>
            Get Started with Your Pharmacy
          </h2>
          <p className="text-[14px] leading-relaxed mb-0" style={{ color: T.body }}>
            Set up your pharmacy account and start tracking medicines, sales, purchase orders, and daily operations effortlessly.
          </p>
        </div>

        <AuthField
          id="name" label="Username" value={name} onChange={setName}
          placeholder="Enter Username" autoComplete="name" inputRef={nameRef}
          addon={<FieldIcon><UserCircle className="w-4 h-4" /></FieldIcon>}
        />

        <AuthField
          id="email" label="Email Address" type="email" value={email} onChange={setEmail}
          placeholder="Enter Email address" autoComplete="email"
          addon={<FieldIcon><Mail className="w-4 h-4" /></FieldIcon>}
        />

        {/* Required by the API's RegisterRequest — not present in the reference layout. */}
        <AuthField
          id="phone" label="Phone Number" type="tel" value={phoneNumber} onChange={setPhoneNumber}
          placeholder="Enter Phone Number" autoComplete="tel"
          addon={<FieldIcon><ShieldCheck className="w-4 h-4" /></FieldIcon>}
        />

        <AuthField
          id="password" label="Password" type={showPassword ? 'text' : 'password'}
          value={password} onChange={setPassword}
          placeholder="Enter Password" autoComplete="new-password"
          onKeyUp={syncCapsLock} onKeyDown={syncCapsLock} onClick={syncCapsLock}
          onBlur={() => setCapsLock(false)}
          describedBy={capsLock ? 'capslock-hint' : undefined}
          addon={
            <FieldButton onClick={() => setShowPassword(v => !v)} pressed={showPassword}
              label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </FieldButton>
          }
        />
        {capsLock && (
          <p id="capslock-hint" className="text-[#D97F06] text-[12px] -mt-1 mb-2 flex items-center gap-1.5 text-start">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Caps Lock is on
          </p>
        )}

        <div className="mb-4">
          <AuthField
            id="confirm" label="Confirm Password" type={showConfirm ? 'text' : 'password'}
            value={confirm} onChange={setConfirm}
            placeholder="Enter Confirm Password" autoComplete="new-password"
            invalid={mismatch}
            describedBy={mismatch ? 'confirm-hint' : undefined}
            addon={
              <FieldButton onClick={() => setShowConfirm(v => !v)} pressed={showConfirm}
                label={showConfirm ? 'Hide password' : 'Show password'}>
                {showConfirm ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </FieldButton>
            }
          />
          {mismatch ? (
            <p id="confirm-hint" className="text-[#D42314] text-[12px] mt-1 text-start">
              Passwords do not match.
            </p>
          ) : confirm.length > 0 && (
            <p className="text-[#0F9291] text-[12px] mt-1 flex items-center gap-1.5 text-start">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Passwords match
            </p>
          )}
        </div>

        <div aria-live="polite" aria-atomic="true">
          <AuthError message={error} />
        </div>

        <div className="mb-4">
          <AuthSubmit loading={isLoading} loadingLabel="Creating Account" disabled={mismatch}>
            Sign Up <ArrowRight className="w-4 h-4" />
          </AuthSubmit>
        </div>

        <div className="text-center mt-4">
          <p className="text-[14px] font-normal mb-0" style={{ color: T.heading }}>
            Already have an account?{' '}
            <Link href="/login" className="font-medium hover:underline" style={{ color: T.primary }}>Sign In</Link>
          </p>
        </div>
      </form>
    </AuthShell>
  );
}
