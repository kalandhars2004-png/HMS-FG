'use client';

/**
 * Shared loading primitives. Every page should compose these rather than
 * hand-rolling its own spinner, so loading looks the same across the app.
 *
 * All motion here degrades under `prefers-reduced-motion` via the global rule
 * in globals.css, which collapses animation and transition durations.
 */

/* ------------------------------------------------------------------ */
/* Skeletons                                                           */
/* ------------------------------------------------------------------ */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

/** A single metric/stat tile. */
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 ${className}`} aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-5 w-28 rounded" />
        </div>
      </div>
    </div>
  );
}

/** Chart panel placeholder. Bars are static height — no animation, no layout shift. */
export function ChartSkeleton({ height = 320, className = '' }: { height?: number; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-4 w-36 rounded" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="flex items-end gap-3 h-[calc(100%-72px)]">
        {[62, 84, 47, 93, 71, 55, 88].map((h, i) => (
          <div key={i} className="skeleton flex-1 rounded-t-md" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

/** Tabular placeholder. */
export function TableSkeleton({ rows = 6, cols = 5, className = '' }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden ${className}`} aria-hidden="true">
      <div className="flex gap-4 px-5 py-3 border-b border-[var(--border-color)]">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1 rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-5 py-3.5 border-b border-[var(--border-color)] last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-3.5 flex-1 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Generic titled block. */
export function SectionSkeleton({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true">
      <Skeleton className="h-5 w-48 rounded" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3.5 rounded ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inline page loader                                                  */
/* ------------------------------------------------------------------ */

/** Small indeterminate spinner for in-page waits. */
export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <svg className="animate-spin h-4 w-4 text-[var(--primary)]" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Indeterminate progress bar                                          */
/* ------------------------------------------------------------------ */

/**
 * Thin indeterminate track. Used when there is no measurable percentage —
 * we never fake a 0→100% fill.
 */
export function ProgressTrack({ className = '' }: { className?: string }) {
  return (
    <div className={`h-[3px] w-full rounded-full overflow-hidden bg-[var(--gray-200)] dark:bg-white/10 ${className}`} aria-hidden="true">
      <div className="h-full w-1/3 rounded-full bg-[var(--primary)] animate-indeterminate" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Application boot screen                                             */
/* ------------------------------------------------------------------ */

export type BootStage = {
  id: string;
  label: string;
  /** pending | active | done */
  state: 'pending' | 'active' | 'done';
};

export type AppLoaderProps = {
  /** Ordered initialisation steps, driven by real work — not a timer. */
  stages: BootStage[];
  /** Signed-in user's display name, when known. */
  userName?: string;
  /** Set once the wait exceeds a couple of seconds. */
  slow?: boolean;
  /** Populated when initialisation failed. */
  error?: { title: string; message: string; expired?: boolean } | null;
  onRetry?: () => void;
  onSignOut?: () => void;
};

/**
 * Full-screen application boot state. Deliberately compact: a brand block, a
 * short status list and an indeterminate bar. It is only rendered when
 * initialisation actually takes long enough to be worth showing.
 */
export function AppLoader({ stages, userName, slow, error, onRetry, onSignOut }: AppLoaderProps) {
  const initial = (userName || '').trim().charAt(0).toUpperCase();
  const active = stages.find(s => s.state === 'active');

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-5 py-10 bg-[#F8FAFC] dark:bg-[#0B1220]">
      <div className="w-full max-w-[380px] flex flex-col items-center text-center animate-boot-in">

        {/* Brand */}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm shrink-0"
          style={{ background: 'linear-gradient(103.28deg, #0EA5A4 0%, #175780 100%)' }}>
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m10.5 20.5 10-10a5 5 0 0 0-7-7l-10 10a5 5 0 0 0 7 7Z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m8.5 8.5 7 7" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="mt-4 text-[20px] font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
          Inventory Management
        </h1>

        {error ? (
          /* ---------------- Error ---------------- */
          <div className="w-full mt-2" role="alert">
            <p className="text-[14px] font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{error.title}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#64748B] dark:text-[#94A3B8]">{error.message}</p>

            <div className="mt-6 flex flex-col gap-2">
              {error.expired ? (
                <button
                  onClick={onSignOut}
                  className="w-full h-10 rounded-lg text-white text-[14px] font-semibold transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9291]/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0B1220]"
                  style={{ background: 'linear-gradient(103.28deg, #0EA5A4 0%, #175780 100%)' }}
                >
                  Sign In Again
                </button>
              ) : (
                <>
                  <button
                    onClick={onRetry}
                    className="w-full h-10 rounded-lg text-white text-[14px] font-semibold transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9291]/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0B1220]"
                    style={{ background: 'linear-gradient(103.28deg, #0EA5A4 0%, #175780 100%)' }}
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onSignOut}
                    className="w-full h-10 rounded-lg text-[14px] font-medium border border-[var(--border-color)] text-[#64748B] dark:text-[#94A3B8] hover:bg-white dark:hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9291]/40"
                  >
                    Log out
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* ---------------- Loading ---------------- */
          <>
            <p className="mt-1.5 text-[13px] text-[#64748B] dark:text-[#94A3B8]">
              {slow ? 'Still preparing your workspace…' : 'Preparing your workspace…'}
            </p>

            {userName && (
              <div className="mt-5 inline-flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-full bg-white dark:bg-[#111827] border border-[var(--border-color)] shadow-sm">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                  style={{ background: 'linear-gradient(103.28deg, #0EA5A4 0%, #175780 100%)' }}>
                  {initial || '?'}
                </span>
                <span className="text-[13px] font-medium text-[#0F172A] dark:text-[#F8FAFC]">
                  Welcome back, {userName}
                </span>
              </div>
            )}

            <div className="w-full mt-7">
              <ProgressTrack />
            </div>

            {/* Status list — the single live region for screen readers */}
            <ul className="w-full mt-5 space-y-2 text-left" role="status" aria-live="polite" aria-atomic="false">
              {stages.map(s => (
                <li key={s.id} className="flex items-center gap-2.5 text-[13px] transition-opacity duration-200"
                  style={{ opacity: s.state === 'pending' ? 0.4 : 1 }}>
                  <span className="w-4 h-4 shrink-0 flex items-center justify-center">
                    {s.state === 'done' ? (
                      <svg className="w-4 h-4 text-[var(--primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : s.state === 'active' ? (
                      <svg className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] dark:bg-[#334155]" />
                    )}
                  </span>
                  <span className={s.state === 'done'
                    ? 'text-[#64748B] dark:text-[#94A3B8]'
                    : 'text-[#0F172A] dark:text-[#F8FAFC] font-medium'}>
                    {s.label}
                  </span>
                </li>
              ))}
            </ul>

            {slow && active && (
              <p className="mt-4 text-[12px] text-[#94A3B8]">
                {active.label} is taking longer than usual.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
