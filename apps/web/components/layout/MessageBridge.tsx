'use client';

import { useMessages, useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { setMessageResolver } from '@/lib/messages';

/**
 * `lib/axios.ts` React daraxtidan tashqarida ishlaydi, shuning uchun
 * u yerda tarjima ilgagini chaqirib bo'lmaydi. Bu komponent ichkarida
 * turib tarjima funksiyasini `lib/messages.ts`ga ulaydi.
 */
export function MessageBridge() {
  const t = useTranslations('serverMessages');
  const messages = useMessages() as Record<string, Record<string, string> | undefined>;

  useEffect(() => {
    setMessageResolver((code, values) => {
      if (!messages.serverMessages?.[code]) return null;

      try {
        return t(code as never, values as never);
      } catch {
        return null;
      }
    });
  }, [t, messages]);

  return null;
}
