import { QueryClient, isServer } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

const make = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,

        retry(failureCount, error) {
          if (isAxiosError(error)) {
            const status = error.response?.status ?? 0;
            if (status >= 400 && status < 500) return false;
          }

          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });

let browserClient: QueryClient | undefined;

export const getQueryClient = (): QueryClient => {
  if (isServer) return make();

  browserClient ??= make();
  return browserClient;
};
