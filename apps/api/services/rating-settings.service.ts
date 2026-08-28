import { Inject, Injectable, InjectContext } from '@tsed/di';
import { PlatformContext } from '@tsed/common';
import type { Request } from 'express';
import prisma from '@/modules/db';
import { redis, isRedisReady } from '@/modules/redis';
import { AuditService } from '@/services/audit.service';
import type { RatingSettingsOutput, UpdateRatingSettingsInput } from '@repo/contracts';

@Injectable()
export class RatingSettingsService {
  @Inject()
  private auditService!: AuditService;

  @InjectContext()
  private context!: PlatformContext;

  private get actor() {
    const user = this.context.getRequest<Request>().user!;
    return { actorId: user.id, actorEmail: user.email };
  }

  private static readonly CACHE_KEY = 'rating-settings';
  private static readonly DEFAULTS = {
    avgScoreWeight: 0.4,
    bestScoreWeight: 0.2,
    consistencyWeight: 0.2,
    attemptCountWeight: 0.2,
    minAttemptsRequired: 1,
  };

  async get(): Promise<RatingSettingsOutput> {
    const cached = await this.readCache();
    if (cached) return cached;

    const settings = await this.getOrCreateRow();
    await this.writeCache(settings);

    return settings;
  }

  async update(input: UpdateRatingSettingsInput): Promise<RatingSettingsOutput> {
    const row = await this.getOrCreateRow();

    const updated = await prisma.ratingSettings.update({
      where: { id: row.id },
      data: input,
    });

    const output = this.toOutput(updated);
    await this.writeCache(output);

    await this.auditService.log({
      ...this.actor,
      action: 'RATING_SETTINGS_UPDATED',
      entityType: 'RatingSettings',
      entityId: row.id,
      before: this.toOutput(row),
      after: output,
    });

    return output;
  }

  private async getOrCreateRow() {
    const existing = await prisma.ratingSettings.findFirst();
    if (existing) return existing;

    return prisma.ratingSettings.create({ data: RatingSettingsService.DEFAULTS });
  }

  private toOutput(settings: {
    avgScoreWeight: number;
    bestScoreWeight: number;
    consistencyWeight: number;
    attemptCountWeight: number;
    minAttemptsRequired: number;
  }): RatingSettingsOutput {
    return {
      avgScoreWeight: settings.avgScoreWeight,
      bestScoreWeight: settings.bestScoreWeight,
      consistencyWeight: settings.consistencyWeight,
      attemptCountWeight: settings.attemptCountWeight,
      minAttemptsRequired: settings.minAttemptsRequired,
    };
  }

  private async readCache(): Promise<RatingSettingsOutput | null> {
    if (!isRedisReady()) return null;

    try {
      const raw = await redis.get(RatingSettingsService.CACHE_KEY);
      return raw ? (JSON.parse(raw) as RatingSettingsOutput) : null;
    } catch {
      return null;
    }
  }

  private async writeCache(settings: RatingSettingsOutput): Promise<void> {
    if (!isRedisReady()) return;

    try {
      await redis.set(RatingSettingsService.CACHE_KEY, JSON.stringify(settings));
    } catch {
      // Redis kesh o'chirilgan bo'lishi mumkin — muvaffaqiyatsizlik jim o'tkaziladi, DB manba bo'lib qoladi.
    }
  }
}
