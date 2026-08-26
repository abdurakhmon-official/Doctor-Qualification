import axios, { isAxiosError } from 'axios';
import Cookie from 'js-cookie';
import { toast } from 'sonner';
import { messageFor } from '@/lib/messages';
import { routing } from '@/i18n/routing';
import { store } from '@/store/store';
import { logout } from '@/store/slices/auth.slice';
import type { ApiError, ApiResponse } from '@repo/contracts';

export const TOKEN_COOKIE = 'token';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  const token = Cookie.get(TOKEN_COOKIE);
  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

api.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown> | undefined;
    const message = messageFor(body?._code, body?._message, body?.meta);
    if (message) toast.success(message);

    return response;
  },
  (error: unknown) => {
    if (!isAxiosError<ApiError>(error)) return Promise.reject(error);

    const status = error.response?.status;
    const body = error.response?.data;

    if (status === 401) {
      Cookie.remove(TOKEN_COOKIE);
      store.dispatch(logout());
      redirectToSignIn();

      return Promise.reject(error);
    }

    const handledInPlace = (body?.errors?.length ?? 0) > 0;

    if (!handledInPlace) {
      toast.error(messageFor(body?._code, body?._message, body?.meta) ?? error.message);
    }

    return Promise.reject(error);
  },
);

function redirectToSignIn(): void {
  if (typeof window === 'undefined') return;

  const [, first] = window.location.pathname.split('/');
  const locale = first && (routing.locales as readonly string[]).includes(first) ? first : routing.defaultLocale;

  const target = `/${locale}/sign-in`;
  if (window.location.pathname === target) return;

  const next = window.location.pathname + window.location.search;
  window.location.href = `${target}?next=${encodeURIComponent(next)}`;
}

export default api;
