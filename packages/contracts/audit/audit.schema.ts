import { z } from 'zod';

// schemas

export const AdminAuditLogQuerySchema = z.object({
  entityType: z.string().optional(),
  actorId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  size: z.coerce.number().int().positive().max(50).default(20),
});

// types

export type AdminAuditLogQuery = z.infer<typeof AdminAuditLogQuerySchema>;

// interfaces

export interface AdminAuditLogItem {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  createdAt: string;
}
