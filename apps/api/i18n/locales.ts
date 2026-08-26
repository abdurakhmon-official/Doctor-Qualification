import { LOCALES, DEFAULT_LOCALE } from '@repo/contracts';
import type { Locale } from '@repo/contracts';

const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value);

export const resolveLocale = (value: unknown): Locale => (isLocale(value) ? value : DEFAULT_LOCALE);

export { LOCALES, DEFAULT_LOCALE, isLocale };
export type { Locale };
