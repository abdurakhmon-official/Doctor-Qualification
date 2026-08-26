import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Vazirmatn } from 'next/font/google';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Providers } from '@/app/providers';
import { MessageBridge } from '@/components/layout/MessageBridge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { routing } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import '@/app/globals.css';

/**
 * Ildiz layout.
 *
 * DIQQAT: u `app/` da emas, `app/[locale]/` da turadi — til segmenti
 * ildiz layoutdan oldin kelishi kerak, aks holda `next-intl` ishlamaydi.
 */

const sans = Inter({ subsets: ['latin'], variable: '--font-sans-latin' });
const vazirmatn = Vazirmatn({ subsets: ['arabic', 'latin'], variable: '--font-sans-fa' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

/* fa/ps arab yozuvi bilan yoziladi — RTL yo'nalish shu ikkisi uchun kerak, en LTR qoladi. */
const RTL_LOCALES = new Set(['fa', 'ps']);

export const metadata: Metadata = {
  title: {
    default: 'App',
    template: '%s · App',
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const dir = RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      className={cn('h-full antialiased', sans.variable, vazirmatn.variable, mono.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <NextIntlClientProvider>
          <Providers>
            <MessageBridge />
            <Header />
            {children}
            <Footer />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
