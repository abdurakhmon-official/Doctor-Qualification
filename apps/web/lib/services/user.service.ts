import type { AdminUserListItem, AdminUserQuery, SetActiveInput, UpdateRoleInput } from '@repo/contracts';
import { BaseService, type Paged } from '@/lib/services/base.service';

export class UserService extends BaseService<AdminUserListItem, never, never> {
  protected BASE_PATH = 'users';

  async list(query: Partial<AdminUserQuery> = {}): Promise<Paged<AdminUserListItem>> {
    return this.sendGetPaged<AdminUserListItem>('', query);
  }

  async updateRole(userId: string, input: UpdateRoleInput): Promise<AdminUserListItem> {
    return this.sendPut<AdminUserListItem, UpdateRoleInput>(`/${userId}/role`, input);
  }

  async setActive(userId: string, input: SetActiveInput): Promise<AdminUserListItem> {
    return this.sendPut<AdminUserListItem, SetActiveInput>(`/${userId}/active`, input);
  }
}

export const userService = new UserService();
