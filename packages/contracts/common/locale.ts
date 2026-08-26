import { z } from 'zod';

export const LOCALES = ['uz', 'ru', 'en'] as const;
export const DEFAULT_LOCALE: Locale = 'uz';

// schemas

export const LocaleSchema = z.enum(LOCALES);

// types

export type Locale = (typeof LOCALES)[number];
