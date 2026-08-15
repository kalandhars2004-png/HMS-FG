'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

/**
 * POS lives outside the (app) route group, so it does NOT inherit the auth guard in
 * app/(app)/layout.tsx. Without this, anyone could open the checkout screen
 * unauthenticated — on the one terminal most likely to be left unattended.
 */
export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setRedirecting(true);
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || redirecting || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F9291] to-teal-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">{redirecting ? 'Redirecting...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 dark:bg-[#0a0a0f]">
      {children}
    </div>
  );
}
