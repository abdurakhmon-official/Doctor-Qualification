// types

type Values = Record<string, string | number>;
type Resolver = (code: string, values?: Values) => string | null;

let resolve: Resolver = () => null;

/** `components/layout/message-bridge.tsx` shu yerga next-intl tarjimasini ulaydi. */
export const setMessageResolver = (next: Resolver): void => {
  resolve = next;
};

/**
 * Backend `_code`sini o'quvchi tiliga tarjima qiladi.
 *
 * `values` — tarjima interpolyatsiya qiladigan qiymatlar (backend
 * `meta` orqali yuboradi). Kod topilmasa yoki tarjima bo'lmasa,
 * backend yuborgan xom matnga (`fallback`) tushadi.
 */
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
