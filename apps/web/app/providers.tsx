'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Provider as ReduxProvider } from 'react-redux';
import { Toaster } from 'sonner';
import { getQueryClient } from '@/lib/query-client';
import { store } from '@/store/store';

/**
 * `next-themes` inline `<script>` (FOUC-oldini olish uchun) React 19.2'da
 * yolg'on-musbat ogohlantirish chiqaradi — kutubxona yangilanmagan
 * (pacocoursey/next-themes#385). Faqat shu xabarni dev'da filtrlaymiz.
 */
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag while rendering')) {
      return;
    }
    originalError(...args);
  };
}

/**
 * Barcha provayderlar bitta joyda.
 *
 * Tartib muhim: `ReduxProvider` eng tashqarida — `lib/axios.ts` 401
 * javobida store'ga murojaat qilishi mumkin, bu esa Query'dan oldin
 * tayyor bo'lishi kerak. `ThemeProvider` — `attribute="class"`, chunki
 * `globals.css`dagi qorong'i palitra `.dark` klassiga bog'langan.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </QueryClientProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
}
