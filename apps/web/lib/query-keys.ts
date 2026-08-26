/**
 * Central query key registry (rule: CODING_STANDARDS.md §4).
 * Add new domains here — never write a query key array inline in useQuery.
 */
export const queryKeys = {
  me: ['me'] as const,
  /* base keys — used as a param-less prefix with invalidateQueries (cancels all pages/filters at once) */
  adminUsersBase: ['admin-users'] as const,
  adminUsers: (query: Record<string, unknown> = {}) => [...queryKeys.adminUsersBase, query] as const,
};
