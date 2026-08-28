import { Inject, Injectable, InjectContext } from '@tsed/di';
import { PlatformContext } from '@tsed/common';
import type { Request } from 'express';
import prisma from '@/modules/db';
import type { CreateSpecialtyInput, UpdateSpecialtyInput } from '@/inputs/specialty.input';
import { SpecialtyNotFoundException } from '@/exceptions/specialty.exceptions';
import { AuditService } from '@/services/audit.service';

@Injectable()
export class SpecialtyService {
  @InjectContext()
  private context!: PlatformContext;

  @Inject()
  private auditService!: AuditService;

  private get actor() {
    const user = this.context.getRequest<Request>().user!;
    return { actorId: user.id, actorEmail: user.email };
  }

  async list() {
    const specialties = await prisma.specialty.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    return { success: true, data: specialties };
  }

  async adminList() {
    const specialties = await prisma.specialty.findMany({
      orderBy: { order: 'asc' },
    });

    return { success: true, data: specialties };
  }

  async create(input: CreateSpecialtyInput) {
    const specialty = await prisma.specialty.create({ data: input });

    await this.auditService.log({
      ...this.actor,
      action: 'SPECIALTY_CREATED',
      entityType: 'Specialty',
      entityId: specialty.id,
      after: specialty,
    });

    return { success: true, data: specialty };
  }

  async update(specialtyId: string, input: UpdateSpecialtyInput) {
    const before = await prisma.specialty.findUnique({ where: { id: specialtyId } });
    if (!before) throw new SpecialtyNotFoundException(specialtyId);

    const specialty = await prisma.specialty.update({ where: { id: specialtyId }, data: input });

    await this.auditService.log({
      ...this.actor,
      action: 'SPECIALTY_UPDATED',
      entityType: 'Specialty',
      entityId: specialty.id,
      before,
      after: specialty,
    });

    return { success: true, data: specialty };
  }

  /** Boshqa domen service'lari (masalan ExamService) specialtyId mavjudligini shu orqali tekshiradi — o'z Prisma modeliga bevosita kirmaydi. */
  async assertExists(specialtyId: string): Promise<void> {
    const specialty = await prisma.specialty.findUnique({ where: { id: specialtyId }, select: { id: true } });
    if (!specialty) throw new SpecialtyNotFoundException(specialtyId);
  }
}
