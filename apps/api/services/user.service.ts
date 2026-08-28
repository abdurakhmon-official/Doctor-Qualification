import { Inject, Injectable, InjectContext } from '@tsed/di';
import { PlatformContext } from '@tsed/common';
import type { Request } from 'express';
import { AdminUserQuerySchema } from '@repo/contracts';
import prisma from '@/modules/db';
import { requireUserId } from '@/utils/errors.utils';
import { USER_PUBLIC_SELECT } from '@/utils/constants';
import type { SetActiveInput, UpdateProfileInput, UpdateRoleInput } from '@/inputs/user.input';
import { USER_ROLE } from '../generated/prisma';
import { AdminCannotModifySelfException, UserNotFoundException } from '@/exceptions/user.exceptions';
import { AuditService } from '@/services/audit.service';

@Injectable()
export class UserService {
  private static readonly SELECT = { id: true, fullName: true };
  private static readonly LIST_SELECT = {
    id: true,
    fullName: true,
    email: true,
    role: true,
    active: true,
    emailVerified: true,
    createdAt: true,
  };

  @InjectContext()
  private context!: PlatformContext;

  @Inject()
  private auditService!: AuditService;

  private get user() {
    return this.context.getRequest<Request>().user;
  }

  private get currentUserId(): string {
    return requireUserId(this.user);
  }

  private get actor() {
    const user = this.user!;
    return { actorId: user.id, actorEmail: user.email };
  }

  async updateProfile(input: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: this.currentUserId },
      data: { fullName: input.fullName, phone: input.phone, avatar: input.avatar },
      select: USER_PUBLIC_SELECT,
    });

    return {
      success: true,
      _code: 'PROFILE_UPDATED',
      _message: 'Profile updated',
      data: { ...user, isAdmin: user.role === USER_ROLE.ADMIN },
    };
  }

  async getById(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: UserService.SELECT });
    if (!user) throw new UserNotFoundException(userId);

    return user;
  }

  /** AdminService.stats() uchun — rol bo'yicha foydalanuvchi soni. */
  async countByRole() {
    const grouped = await prisma.user.groupBy({ by: ['role'], _count: true });
    const countOf = (role: keyof typeof USER_ROLE) => grouped.find((group) => group.role === USER_ROLE[role])?._count ?? 0;

    return {
      total: grouped.reduce((sum, group) => sum + group._count, 0),
      users: countOf('USER'),
      admins: countOf('ADMIN'),
    };
  }

  async list(rawQuery: unknown) {
    const { role, search, page, size } = AdminUserQuerySchema.parse(rawQuery);

    const where = {
      ...(role ? { role } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: UserService.LIST_SELECT,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      success: true,
      data: users.map((user) => ({ ...user, createdAt: user.createdAt.toISOString() })),
      meta: { page, limit: size, total },
    };
  }

  async updateRole(userId: string, input: UpdateRoleInput) {
    this.assertNotSelf(userId);
    const before = await this.findOrThrow(userId);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: input.role },
      select: UserService.LIST_SELECT,
    });

    await this.auditService.log({
      ...this.actor,
      action: 'USER_ROLE_UPDATED',
      entityType: 'User',
      entityId: userId,
      before: { role: before.role },
      after: { role: user.role },
    });

    return { success: true, data: { ...user, createdAt: user.createdAt.toISOString() } };
  }

  async setActive(userId: string, input: SetActiveInput) {
    this.assertNotSelf(userId);
    const before = await this.findOrThrow(userId);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { active: input.active },
      select: UserService.LIST_SELECT,
    });

    await this.auditService.log({
      ...this.actor,
      action: 'USER_ACTIVE_UPDATED',
      entityType: 'User',
      entityId: userId,
      before: { active: before.active },
      after: { active: user.active },
    });

    return { success: true, data: { ...user, createdAt: user.createdAt.toISOString() } };
  }

  private assertNotSelf(userId: string): void {
    if (userId === this.currentUserId) {
      throw new AdminCannotModifySelfException();
    }
  }

  private async findOrThrow(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, active: true } });
    if (!user) throw new UserNotFoundException(userId);
    return user;
  }
}
