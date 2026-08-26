'use client';

import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { cn } from '@/lib/utils';

const LABELS: Record<string, string> = { fa: 'دری', ps: 'پښتو', en: 'EN' };

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();

  return (
    <div role="group" aria-label="Language" className="flex items-center gap-0.5 rounded-lg bg-muted p-0.75">
      {routing.locales.map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={code === locale}
          onClick={() =>
            router.replace(
              // @ts-expect-error -- pathname is dynamically typed by next-intl per route
              { pathname, params },
              { locale: code },
            )
          }
          className={cn(
            'rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors',
            code === locale
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {LABELS[code] ?? code}
        </button>
      ))}
    </div>
  );
}
