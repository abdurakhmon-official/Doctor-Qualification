import type { LocalizedText, Locale } from '@repo/contracts';

export const pickLocalized = (text: LocalizedText, locale: Locale): string => text[locale] ?? text.fa;
