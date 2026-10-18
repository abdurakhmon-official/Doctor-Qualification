import { Inject, Injectable, InjectContext } from '@tsed/di';
import { PlatformContext } from '@tsed/common';
import type { Request } from 'express';
import type { TopicOutput } from '@repo/contracts';
import prisma from '@/modules/db';
import type { CreateTopicInput, TopicQuery, UpdateTopicInput } from '@/inputs/topic.input';
import { TopicNotFoundException, TopicSpecialtyMismatchException } from '@/exceptions/topic.exceptions';
import { AuditService } from '@/services/audit.service';
import { SpecialtyService } from '@/services/specialty.service';

@Injectable()
export class TopicService {
  @InjectContext()
  private context!: PlatformContext;

  @Inject()
  private auditService!: AuditService;

  @Inject()
  private specialtyService!: SpecialtyService;

  private static readonly SELECT = {
    id: true,
    specialtyId: true,
    name: true,
    isActive: true,
    order: true,
    _count: { select: { questions: true } },
  };

  private get actor() {
    const user = this.context.getRequest<Request>().user!;
    return { actorId: user.id, actorEmail: user.email };
  }

  async list({ specialtyId }: TopicQuery) {
    const topics = await prisma.topic.findMany({
      where: { isActive: true, ...(specialtyId ? { specialtyId } : {}) },
      select: TopicService.SELECT,
      orderBy: [{ specialtyId: 'asc' }, { order: 'asc' }],
    });

    return { success: true, data: topics.map(TopicService.toOutput) };
  }

  async adminList({ specialtyId }: TopicQuery) {
    const topics = await prisma.topic.findMany({
      where: specialtyId ? { specialtyId } : {},
      select: TopicService.SELECT,
      orderBy: [{ specialtyId: 'asc' }, { order: 'asc' }],
    });

    return { success: true, data: topics.map(TopicService.toOutput) };
  }

  async create(input: CreateTopicInput) {
    await this.specialtyService.assertExists(input.specialtyId);

    const count = await prisma.topic.count({ where: { specialtyId: input.specialtyId } });

    const topic = await prisma.topic.create({
      data: { specialtyId: input.specialtyId, name: input.name, order: count },
      select: TopicService.SELECT,
    });

    const output = TopicService.toOutput(topic);

    await this.auditService.log({
      ...this.actor,
      action: 'TOPIC_CREATED',
      entityType: 'Topic',
      entityId: topic.id,
      after: output,
    });

    return { success: true, data: output };
  }

  async update(topicId: string, input: UpdateTopicInput) {
    const before = await prisma.topic.findUnique({ where: { id: topicId }, select: TopicService.SELECT });
    if (!before) throw new TopicNotFoundException(topicId);

    const topic = await prisma.topic.update({ where: { id: topicId }, data: input, select: TopicService.SELECT });
    const output = TopicService.toOutput(topic);

    await this.auditService.log({
      ...this.actor,
      action: 'TOPIC_UPDATED',
      entityType: 'Topic',
      entityId: topic.id,
      before: TopicService.toOutput(before),
      after: output,
    });

    return { success: true, data: output };
  }

  /** Every non-null topic id must exist and belong to `specialtyId`, so a question can't be filed under another specialty's topic. */
  async assertBelongToSpecialty(topicIds: (string | null | undefined)[], specialtyId: string): Promise<void> {
    const ids = [...new Set(topicIds.filter((id): id is string => Boolean(id)))];
    if (!ids.length) return;

    const topics = await prisma.topic.findMany({ where: { id: { in: ids } }, select: { id: true, specialtyId: true } });

    for (const id of ids) {
      const topic = topics.find((item) => item.id === id);
      if (!topic) throw new TopicNotFoundException(id);
      if (topic.specialtyId !== specialtyId) throw new TopicSpecialtyMismatchException(id);
    }
  }

  private static toOutput(topic: {
    id: string;
    specialtyId: string;
    name: unknown;
    isActive: boolean;
    order: number;
    _count: { questions: number };
  }): TopicOutput {
    return {
      id: topic.id,
      specialtyId: topic.specialtyId,
      name: topic.name as TopicOutput['name'],
      isActive: topic.isActive,
      order: topic.order,
      questionCount: topic._count.questions,
    };
  }
}
