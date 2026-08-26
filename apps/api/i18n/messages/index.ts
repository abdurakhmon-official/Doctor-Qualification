import type { Locale } from '@repo/contracts';
import { en } from './en.messages';
import { uz } from './uz.messages';
import { ru } from './ru.messages';
import type { MessageCode } from './message-codes';

const CATALOGS: Record<Locale, Record<MessageCode, string>> = { en, uz, ru };

export const translate = (code: string, locale: Locale): string | null => {
  const catalog = CATALOGS[locale];
  return code in catalog ? catalog[code as MessageCode] : null;
};

export type { MessageCode };
