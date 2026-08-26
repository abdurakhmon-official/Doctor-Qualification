import { z } from 'zod';

// schemas

export const UserRoleSchema = z.enum(['ADMIN', 'TEACHER', 'STUDENT']);

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

// types

export type UserRole = z.infer<typeof UserRoleSchema>;
export type AdminUserQuery = z.infer<typeof AdminUserQuerySchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleInputSchema>;
export type SetActiveInput = z.infer<typeof SetActiveInputSchema>;

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
