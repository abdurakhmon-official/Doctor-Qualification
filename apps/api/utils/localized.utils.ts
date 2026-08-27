import type { Locale } from '@repo/contracts';

/** `Specialty.name`/`Exam.title` kabi Json ustunlardan joriy so'rov tiliga mos matnni oladi. */
export const pickLocalized = (value: unknown, locale: Locale): string => {
  const record = value as Record<string, string> | null;
  return record?.[locale] ?? record?.uz ?? '';
};
