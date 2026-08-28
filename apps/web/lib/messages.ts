// types

type Values = Record<string, string | number>;
type Resolver = (code: string, values?: Values) => string | null;

let resolve: Resolver = () => null;

export const setMessageResolver = (next: Resolver): void => {
  resolve = next;
};

export const messageFor = (
  code: string | undefined,
  fallback: string | undefined,
  values?: Values,
): string | null => {
  if (code) {
    const translated = resolve(code, values);
    if (translated) return translated;
  }

  return fallback ?? null;
};

export type { Resolver, Values };
