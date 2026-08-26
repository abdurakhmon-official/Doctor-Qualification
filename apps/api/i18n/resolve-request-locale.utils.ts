import type { Request } from 'express';
import type { Locale } from '@repo/contracts';
import { isLocale, resolveLocale } from './locales';

export const resolveRequestLocale = (request: Request): Locale => {
  const profileLocale = request.user?.locale;
  if (isLocale(profileLocale)) return profileLocale;

  const queryLocale = request.query?.locale;
  if (isLocale(queryLocale)) return queryLocale;

  const header = request.headers['accept-language'];
  const headerLocale = (Array.isArray(header) ? header[0] : header)?.split(',')[0]?.split('-')[0];
  if (isLocale(headerLocale)) return headerLocale;

  return resolveLocale(undefined);
};
