import { z } from 'zod';

export const LOCALES = ['fa', 'ps', 'en'] as const;
export const DEFAULT_LOCALE: Locale = 'fa';

// schemas

export const LocaleSchema = z.enum(LOCALES);

// types

export type Locale = (typeof LOCALES)[number];
