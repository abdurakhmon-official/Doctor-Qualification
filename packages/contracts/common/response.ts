import { z } from 'zod';

// schemas

export const PaginationMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});

export const FieldErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  _code: z.string().optional(),
  _message: z.string(),
  meta: z.record(z.union([z.string(), z.number()])).optional(),
  errors: z.array(FieldErrorSchema).optional(),
});

export const apiResponseSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.literal(true),
    data,
    _code: z.string().optional(),
    _message: z.string().optional(),
    meta: z.record(z.union([z.string(), z.number()])).optional(),
  });

// types

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
export type FieldError = z.infer<typeof FieldErrorSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;

// interfaces

export interface ApiResponse<T> {
  success: true;
  data: T;
  _code?: string;
  _message?: string;
  meta?: Record<string, string | number>;
}
