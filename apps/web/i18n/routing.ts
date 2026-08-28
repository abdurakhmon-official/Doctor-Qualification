import { defineRouting } from 'next-intl/routing';
import { LOCALES, DEFAULT_LOCALE } from '@repo/contracts';

/**
 * Add every new page's route here — this is the project's single source of
 * truth for routes (see CODING_STANDARDS.md).
 *
 * Locales come from @repo/contracts so backend and frontend always agree.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',

  pathnames: {
    '/': '/',
    '/sign-in': '/sign-in',
    '/sign-up': '/sign-up',
    '/admin': '/admin',
    '/admin/users': '/admin/users',
    '/admin/specialties': '/admin/specialties',
    '/admin/exams': '/admin/exams',
    '/admin/exams/new': '/admin/exams/new',
    '/admin/exams/[examId]': '/admin/exams/[examId]',
    '/profile': '/profile',
    '/exams': '/exams',
    '/exams/[examId]': '/exams/[examId]',
    '/attempts/[attemptId]': '/attempts/[attemptId]',
    '/certificates': '/certificates',
    '/certificates/[certificateId]': '/certificates/[certificateId]',
    '/admin/certificates': '/admin/certificates',
    '/admin/rating-settings': '/admin/rating-settings',
    '/admin/audit-logs': '/admin/audit-logs',
    '/admin/certificate-template': '/admin/certificate-template',
    '/rating': '/rating',
  },
});

export type AppPathname = keyof typeof routing.pathnames;
