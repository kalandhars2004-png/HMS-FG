'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { NAV_SECTIONS, canSeeSection, canSeeItem } from '@/components/sidebar/nav';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

function routeMatches(href: string, pathname: string): boolean {
  const base = href.split('?')[0];
  if (base.startsWith('#')) return false;
  return pathname === base || pathname.startsWith(base + '/');
}

function isRouteDenied(pathname: string, role?: string): boolean {
  for (const section of NAV_SECTIONS) {
    const sectionVisible = canSeeSection(section, role);
    for (const item of section.items) {
      if (!routeMatches(item.href, pathname)) continue;
      if (!sectionVisible) return true;
      if (!canSeeItem(item, role)) return true;
    }
  }
  return false;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [redirecting, setRedirecting] = useState(false);

  const denied = useMemo(() => isRouteDenied(pathname, user?.role), [pathname, user?.role]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setRedirecting(true);
      router.push('/login');
      return;
    }
    if (denied) {
      setRedirecting(true);
      router.replace('/dashboard');
    }
  }, [isLoading, user, denied, router]);

  if (isLoading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] dark:bg-[#0a0a0f]">
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

  if (!user || denied) {
    return null;
  }

  return (
    <div className="flex h-screen bg-[#F5F7FA] dark:bg-[#0a0a0f]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        {/* 220ms fade + 6px rise on route change — deliberately almost unnoticeable. */}
        <main className="flex-1 overflow-y-auto p-6 dark:text-gray-100 animate-route-in" key={pathname}>{children}</main>
      </div>
    </div>
  );
}
