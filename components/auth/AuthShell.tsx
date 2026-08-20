'use client';

import Image from 'next/image';
import { Space_Grotesk, Inter } from 'next/font/google';
import { Pill } from '@/components/ui/LucideIcon';

/**
 * Shared chrome for the authentication screens (sign in, sign up, and any
 * password-recovery pages that follow). Mirrors the reference template:
 * an 8/4 column split with the form on the left and a fixed hero on the right.
 */

// The reference pairs two faces: Space Grotesk for body copy, Inter for headings.
export const grotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });
export const inter = Inter({ subsets: ['latin'], weight: ['600', '700'] });

/** Design tokens lifted from the reference theme. */
export const T = {
  primary: '#0F9291',
  gradient: 'linear-gradient(103.28deg, #0EA5A4 0%, #175780 100%)',
  heading: '#101828', // gray-900
  body: '#4A5565',    // gray-600
  border: '#E5E7EB',  // gray-200
  muted: '#6A7282',   // gray-500
  danger: '#D42314',
};

/** h2 — 28px, stepping to 24px under 992px and 22px under 768px, Inter 700. */
export const H2 = `${inter.className} font-bold text-[22px] md:text-[24px] min-[992px]:text-[28px]`;
/** h1 — 35px, stepping to 28px under 992px and 24px under 768px, Inter 700. */
export const H1 = `${inter.className} font-bold text-[24px] md:text-[28px] min-[992px]:text-[35px]`;

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${grotesk.className} min-h-screen bg-white`} style={{ color: T.body }}>
      <div className="flex flex-wrap min-h-screen">

        {/* LEFT — form column (col-lg-8) */}
        <div className="w-full lg:w-2/3 p-3">
          <div className="flex items-center justify-center min-h-screen py-5">
            <div className="w-full max-w-[450px] mx-auto px-2">{children}</div>
          </div>
        </div>

        {/* RIGHT — hero (col-lg-4) */}
        <div className="hidden lg:flex lg:w-1/3 p-0">
          <div className="relative w-full h-screen overflow-hidden">
            <Image src="/auth/auth-bg.jpg" alt="" fill priority className="object-cover object-center" sizes="33vw" />
            <Image src="/auth/authentication-bg-01.png" alt="" width={640} height={200}
              className="absolute top-0 right-0 w-full h-auto pointer-events-none select-none" aria-hidden="true" />
            <Image src="/auth/authentication-bg-02.png" alt="" width={640} height={200}
              className="absolute bottom-0 right-0 w-full h-auto pointer-events-none select-none" aria-hidden="true" />

            <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
              <div className="text-center z-[2]">
                <h1 className={`${H1} text-white leading-tight mb-2 px-3`}>Smart Pharmacy Control Panel</h1>
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

/** Brand lockup, absolutely centred above the form as in the reference. */
export function AuthLogo() {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-0 flex items-center gap-2">
      <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: T.gradient }}>
        <Pill className="w-[18px] h-[18px] text-white" />
      </span>
      <span className={`${inter.className} text-[17px] font-bold tracking-tight`} style={{ color: T.heading }}>
        Inventory<span style={{ color: T.primary }}>MS</span>
      </span>
    </div>
  );
}

/** Bootstrap `input-group-flat`: input plus a bordered icon addon on the right. */
export function AuthField({
  id, label, type = 'text', value, onChange, placeholder, autoComplete,
  invalid, addon, inputRef, onKeyUp, onKeyDown, onClick, onBlur, describedBy,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  invalid?: boolean;
  addon: React.ReactNode;
  inputRef?: React.Ref<HTMLInputElement>;
  onKeyUp?: React.KeyboardEventHandler;
  onKeyDown?: React.KeyboardEventHandler;
  onClick?: React.MouseEventHandler;
  onBlur?: React.FocusEventHandler;
  describedBy?: string;
}) {
  return (
    <div className="mb-2 text-start">
      <label htmlFor={id} className="block text-[14px] font-semibold mb-[6px]" style={{ color: T.heading }}>
        {label}<span style={{ color: T.danger }}> *</span>
      </label>
      <div
        className="flex items-stretch w-full rounded-[5px] border overflow-hidden transition-colors duration-150 bg-white"
        style={{ borderColor: invalid ? T.danger : T.border }}
      >
        <input
          id={id}
          ref={inputRef}
          type={type}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyUp={onKeyUp}
          onKeyDown={onKeyDown}
          onClick={onClick}
          onBlur={onBlur}
          placeholder={placeholder}
          aria-invalid={!!invalid}
          aria-describedby={describedBy}
          className="flex-1 min-w-0 h-[42px] px-3 text-[14px] text-[#101828] placeholder:text-[#99A1AF] bg-transparent outline-none"
        />
        {addon}
      </div>
    </div>
  );
}

/** Non-interactive trailing icon slot. */
export function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center justify-center w-[42px] shrink-0 border-l text-[#6A7282]" style={{ borderColor: T.border }}>
      {children}
    </span>
  );
}

/** Interactive trailing slot, used for the password visibility toggle. */
export function FieldButton({ onClick, label, pressed, children }: {
  onClick: () => void; label: string; pressed: boolean; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className="flex items-center justify-center w-[42px] shrink-0 border-l text-[#6A7282] hover:text-[#101828] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9291]/40 transition-colors"
      style={{ borderColor: T.border }}
    >
      {children}
    </button>
  );
}

/** Full-width gradient submit button with the reference's hover sweep. */
export function AuthSubmit({ loading, loadingLabel, children, disabled }: {
  loading: boolean; loadingLabel: string; children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full h-[44px] rounded-[5px] text-white text-[15px] font-semibold flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9291]/50 focus-visible:ring-offset-2"
      style={{ background: T.gradient, backgroundSize: '200% auto' }}
      onMouseEnter={e => (e.currentTarget.style.backgroundPosition = 'right center')}
      onMouseLeave={e => (e.currentTarget.style.backgroundPosition = 'left center')}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {loadingLabel}
        </>
      ) : children}
    </button>
  );
}

/** Inline error banner. */
export function AuthError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 px-3.5 py-3 rounded-[5px] text-[13px] mb-4 text-start"
      style={{ background: '#FDECEA', border: '1px solid #F6C9C4', color: '#A8201A' }}>
      <svg className="w-4 h-4 shrink-0 mt-[1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

/** Turns a thrown ApiClient error into something a human can act on. */
export function readApiError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : '';
  let detail = '';
  try {
    detail = JSON.parse(raw)?.message ?? '';
  } catch {
    detail = raw;
  }
  if (/failed to fetch|networkerror|load failed/i.test(detail)) {
    return "Can't reach the server. Check that the API is running on port 5050.";
  }
  return detail || fallback;
}
