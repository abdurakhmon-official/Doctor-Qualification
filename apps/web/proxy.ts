import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';

const intl = createIntlMiddleware(routing);

const PROTECTED = ['/admin'];

const GUEST_ONLY = ['/sign-in', '/sign-up'];

export function proxy(request: NextRequest) {
  const response = intl(request);
  if (response.headers.get('location')) return response;

  const { pathname } = request.nextUrl;
  const withoutLocale = stripLocale(pathname);
  const token = request.cookies.get('token')?.value;

  if (!token && PROTECTED.some((path) => withoutLocale.startsWith(path))) {
    const locale = localeOf(pathname);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/sign-in`;
    url.searchParams.set('next', pathname + request.nextUrl.search);

    return NextResponse.redirect(url);
  }

  if (token && GUEST_ONLY.some((path) => withoutLocale.startsWith(path))) {
    const locale = localeOf(pathname);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    url.search = '';

    return NextResponse.redirect(url);
  }

  return response;
}

function localeOf(pathname: string): string {
  const [, first] = pathname.split('/');
  return first && (routing.locales as readonly string[]).includes(first) ? first : routing.defaultLocale;
}

function stripLocale(pathname: string): string {
  const [, first, ...rest] = pathname.split('/');
  if (!first || !(routing.locales as readonly string[]).includes(first)) return pathname;

  return `/${rest.join('/')}`;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
