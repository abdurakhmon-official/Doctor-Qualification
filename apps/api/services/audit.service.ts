import { Injectable } from '@tsed/di';
import { AdminAuditLogQuerySchema } from '@repo/contracts';
import prisma from '@/modules/db';
import type { Prisma } from '../generated/prisma';

interface AuditEntry {
  actorId: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
}

/**
 * Markazlashgan audit trail (rule: dynamic standards.md §4) — settings/lookup jadval o'zgarganda
 * kim/qachon/nimani o'zgartirgani shu orqali yoziladi. Har bir domen o'z audit logikasini
 * yozmaydi — shu service'ni chaqiradi. Yozish muvaffaqiyatsiz bo'lsa ham asosiy amal bekor
 * qilinmaydi — audit log ikkinchi darajali yon ta'sir, uni original mutatsiyani xavf ostiga
 * qo'yish noto'g'ri (masalan Redis o'chib qolgani sertifikat berishni to'xtatmasligi kabi).
 */
@Injectable()
export class AuditService {
  async log(entry: AuditEntry): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: entry.actorId,
          actorEmail: entry.actorEmail,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          before: (entry.before ?? undefined) as Prisma.InputJsonValue,
          after: (entry.after ?? undefined) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      console.error('[audit] failed to write audit log:', error);
    }
  }

  async list(rawQuery: unknown) {
    const { entityType, actorId, page, size } = AdminAuditLogQuerySchema.parse(rawQuery);

    const where = {
      ...(entityType ? { entityType } : {}),
      ...(actorId ? { actorId } : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      success: true,
      data: logs.map((log) => ({ ...log, createdAt: log.createdAt.toISOString() })),
      meta: { page, limit: size, total },
    };
  }
}
