import { Injectable } from '@tsed/di';
import prisma from '@/modules/db';
import { notFound } from '@/utils/errors.utils';
import type { CreateSpecialtyInput, UpdateSpecialtyInput } from '@/inputs/specialty.input';

@Injectable()
export class SpecialtyService {
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

    return { success: true, data: specialty };
  }

  async update(specialtyId: string, input: UpdateSpecialtyInput) {
    await this.findOrThrow(specialtyId);

    const specialty = await prisma.specialty.update({ where: { id: specialtyId }, data: input });

    return { success: true, data: specialty };
  }

  private async findOrThrow(specialtyId: string): Promise<void> {
    const specialty = await prisma.specialty.findUnique({ where: { id: specialtyId }, select: { id: true } });
    if (!specialty) throw notFound('SPECIALTY_NOT_FOUND', 'specialty not found');
  }
}
