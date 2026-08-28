/**
 * Central query key registry (rule: CODING_STANDARDS.md §4).
 * Add new domains here — never write a query key array inline in useQuery.
 */
export const queryKeys = {
  me: ['me'] as const,
  /* base keys — used as a param-less prefix with invalidateQueries (cancels all pages/filters at once) */
  adminUsersBase: ['admin-users'] as const,
  adminUsers: (query: Record<string, unknown> = {}) => [...queryKeys.adminUsersBase, query] as const,
  specialties: ['specialties'] as const,
  adminSpecialties: ['admin-specialties'] as const,
  adminExamsBase: ['admin-exams'] as const,
  adminExams: (query: Record<string, unknown> = {}) => [...queryKeys.adminExamsBase, query] as const,
  adminExam: (examId: string) => ['admin-exam', examId] as const,
  publishedExams: (specialtyId?: string) => ['published-exams', specialtyId ?? null] as const,
  myAttemptsBase: ['my-attempts'] as const,
  attempt: (attemptId: string) => ['attempt', attemptId] as const,
  myCertificatesBase: ['my-certificates'] as const,
  certificate: (certificateId: string) => ['certificate', certificateId] as const,
  adminCertificatesBase: ['admin-certificates'] as const,
  adminCertificates: (query: Record<string, unknown> = {}) => [...queryKeys.adminCertificatesBase, query] as const,
  publicStats: ['public-stats'] as const,
  myDashboard: ['my-dashboard'] as const,
  adminDashboard: ['admin-dashboard'] as const,
  ratingsBase: ['ratings'] as const,
  ratings: (query: Record<string, unknown> = {}) => [...queryKeys.ratingsBase, query] as const,
  myRating: (specialtyId: string) => ['my-rating', specialtyId] as const,
  ratingSettings: ['rating-settings'] as const,
  certificateTemplate: ['certificate-template'] as const,
  adminAuditLogsBase: ['admin-audit-logs'] as const,
  adminAuditLogs: (query: Record<string, unknown> = {}) => [...queryKeys.adminAuditLogsBase, query] as const,
};
