import type { AdminAuditLogItem, AdminAuditLogQuery } from '@repo/contracts';
import { BaseService, type Paged } from '@/lib/services/base.service';

export class AuditService extends BaseService<AdminAuditLogItem, never, never> {
  protected BASE_PATH = 'audit-logs';

  async list(query: Partial<AdminAuditLogQuery> = {}): Promise<Paged<AdminAuditLogItem>> {
    return this.sendGetPaged<AdminAuditLogItem>('', query);
  }
}

export const auditService = new AuditService();
