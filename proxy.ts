import { NextResponse, NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/signup'];
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/branches',
  '/users',
  '/medicines',
  '/categories',
  '/units',
  '/variants',
  '/brands',
  '/racks',
  '/batch-management',
  '/stock',
  '/warehouses',
  '/equipment',
  '/suppliers',
  '/sales',
  '/purchases',
  '/work-orders',
  '/reports',
  '/notifications',
  '/audit',
  '/settings',
  '/pos',
  '/people',
];

function isPublicPath(pathname: string) {
  if (pathname === '/') return true; // handled as redirect
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

function isProtectedPath(pathname: string) {
  if (pathname === '/') return false;
  return PROTECTED_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Skip static assets and Next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/public') ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('authToken')?.value;
  const isAuthed = !!token;

  // Root: redirect based on auth
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = isAuthed ? '/dashboard' : '/login';
    return NextResponse.redirect(url);
  }

  if (!isAuthed && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthed && isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
