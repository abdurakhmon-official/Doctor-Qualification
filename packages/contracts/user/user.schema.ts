import { z } from 'zod';

// schemas

export const UserRoleSchema = z.enum(['ADMIN', 'USER']);

export const AdminUserQuerySchema = z.object({
  role: UserRoleSchema.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  size: z.coerce.number().int().positive().max(50).default(20),
});

export const UpdateRoleInputSchema = z.object({
  role: UserRoleSchema,
});

export const SetActiveInputSchema = z.object({
  active: z.boolean(),
});

export const UpdateProfileInputSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(1).nullable().optional(),
  avatar: z.string().min(1).nullable().optional(),
});

// types

export type UserRole = z.infer<typeof UserRoleSchema>;
export type AdminUserQuery = z.infer<typeof AdminUserQuerySchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleInputSchema>;
export type SetActiveInput = z.infer<typeof SetActiveInputSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;

// interfaces

export interface AdminUserListItem {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  active: boolean;
  emailVerified: boolean;
  createdAt: string;
}
