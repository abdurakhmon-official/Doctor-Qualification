import { z } from 'zod';
import { DEFAULT_LOCALE, LocaleSchema } from '../common/locale';

// schemas

export const PasswordSchema = z.string().min(8, 'VALIDATION_PASSWORD_SHORT').max(128, 'VALIDATION_PASSWORD_LONG');

const assertNotDerived = (password: string, ...parts: (string | null | undefined)[]): boolean => {
  const value = password.toLowerCase();

  return !parts.some((part) => {
    const candidate = (part ?? '').toLowerCase().split('@')[0] ?? '';
    return candidate.length >= 4 && value.includes(candidate);
  });
};

export const SignupInputSchema = z
  .object({
    fullName: z.string().min(1),
    email: z.string().email(),
    password: PasswordSchema,
    locale: LocaleSchema.default(DEFAULT_LOCALE),
  })
  .refine((input) => assertNotDerived(input.password, input.email, input.fullName), {
    message: 'VALIDATION_PASSWORD_PERSONAL',
    path: ['password'],
  });

export const SigninInputSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// types

export type SignupInput = z.infer<typeof SignupInputSchema>;
export type SigninInput = z.infer<typeof SigninInputSchema>;

// interfaces

export interface UserOutput {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  phone: string | null;
  avatar: string | null;
  locale: string;
  emailVerified: boolean;
  active: boolean;
  isAdmin: boolean;
}

export interface AccessTokenOutput {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}
