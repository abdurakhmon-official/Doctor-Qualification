import { Inject, Injectable, InjectContext } from '@tsed/di';
import { $log, PlatformContext } from '@tsed/common';
import type { Request } from 'express';
import { differenceInSeconds } from 'date-fns';
import type { z } from 'zod';
import type {
  CompetitionBadge,
  CompetitionDetail,
  CompetitionEntryDetail,
  CompetitionListItem,
  LeaderboardRow,
  LocalizedText,
  MyCompetitionEntrySummary,
} from '@repo/contracts';
import prisma from '@/modules/db';
import { requireUserId } from '@/utils/errors.utils';
import { gradeAttempt } from '@/utils/scoring.utils';
import { pickQuestionIds } from '@/utils/practice.utils';
import { topicBreakdown } from '@/utils/topic-breakdown.utils';
import { competitionStatus, entryDeadline, rankEntries, weekWindow } from '@/utils/competition.utils';
import { loadFrozenQuestions, publishedPoolWhere, scoreOver, toAttemptQuestion, toReviewQuestion } from '@/utils/frozen-questions.utils';
import { AuditService } from '@/services/audit.service';
import { SpecialtyService } from '@/services/specialty.service';
import { TopicService } from '@/services/topic.service';
import {
  CompetitionEntryNotFoundException,
  CompetitionHasEntriesException,
  CompetitionNotActiveException,
  CompetitionNotEnoughQuestionsException,
  CompetitionNotFoundException,
} from '@/exceptions/competition.exceptions';
import { AttemptAlreadySubmittedException } from '@/exceptions/exam-attempt.exceptions';
import type { CreateCompetitionInputSchema, SubmitCompetitionEntryInput } from '@/inputs/competition.input';
import { Prisma } from '../generated/prisma';

// a submit may arrive a little after the deadline (auto-submit, network); later than this it is treated as expired
const SUBMIT_GRACE_SECONDS = 30;
const LEADERBOARD_SIZE = 50;
const FINISHED_SHOWN = 20;
const ADMIN_LIST_LIMIT = 100;
const BADGE_RANKS = 3;

const WEEKLY = {
  questionCount: 10,
  durationMinutes: 15,
  // a weekly contest needs at least this many published questions in the specialty
  minPool: 10,
  recheckMs: 10 * 60 * 1000,
  title: { uz: 'Haftalik musobaqa', ru: 'Еженедельное соревнование', en: 'Weekly challenge' },
  description: (weekKey: string) => ({
    uz: `${weekKey} haftasi: 10 ta savol, 15 daqiqa, bitta urinish.`,
    ru: `Неделя ${weekKey}: 10 вопросов, 15 минут, одна попытка.`,
    en: `Week ${weekKey}: 10 questions, 15 minutes, one attempt.`,
  }),
};

// per process; the unique (weekKey, specialtyId) index keeps several API instances from creating duplicates
let lastWeeklyCheck = { weekKey: '', at: 0 };

const LIST_SELECT = {
  id: true,
  title: true,
  description: true,
  specialtyId: true,
  questionIds: true,
  durationMinutes: true,
  startsAt: true,
  endsAt: true,
  weekKey: true,
  specialty: { select: { name: true } },
  _count: { select: { entries: { where: { submittedAt: { not: null } } } } },
} satisfies Prisma.CompetitionSelect;

type CompetitionRow = Prisma.CompetitionGetPayload<{ select: typeof LIST_SELECT }>;
type EntryRow = Prisma.CompetitionEntryGetPayload<object>;

@Injectable()
export class CompetitionService {
  @InjectContext()
  private context!: PlatformContext;

  @Inject()
  private auditService!: AuditService;

  @Inject()
  private specialtyService!: SpecialtyService;

  @Inject()
  private topicService!: TopicService;

  private get request(): Request {
    return this.context.getRequest<Request>();
  }

  private get userId(): string {
    return requireUserId(this.request.user);
  }

  private get actor() {
    const user = this.request.user!;
    return { actorId: user.id, actorEmail: user.email };
  }

  // ─── doctor ──────────────────────────────────────────────────────────────

  async list() {
    await this.ensureWeeklySafely();
    const now = new Date();

    const [open, finished] = await Promise.all([
      prisma.competition.findMany({ where: { endsAt: { gt: now } }, select: LIST_SELECT, orderBy: { startsAt: 'asc' } }),
      prisma.competition.findMany({ where: { endsAt: { lte: now } }, select: LIST_SELECT, orderBy: { endsAt: 'desc' }, take: FINISHED_SHOWN }),
    ]);

    const competitions = [...open, ...finished];
    const mine = await this.myEntriesFor(competitions);

    return { success: true, data: competitions.map((competition) => this.toListItem(competition, mine.get(competition.id) ?? null, now)) };
  }

  async detail(competitionId: string) {
    const competition = await this.findOrThrow(competitionId);
    const now = new Date();
    const mine = (await this.myEntriesFor([competition])).get(competition.id) ?? null;

    const top = await prisma.competitionEntry.findMany({
      where: { competitionId, submittedAt: { not: null } },
      select: { userId: true, score: true, timeSpentSeconds: true, submittedAt: true, user: { select: { fullName: true } } },
      orderBy: [{ score: 'desc' }, { timeSpentSeconds: 'asc' }, { submittedAt: 'asc' }],
      take: LEADERBOARD_SIZE,
    });

    // ranks of a prefix only depend on rows above them, so ranking the top slice is exact
    const leaderboard: LeaderboardRow[] = rankEntries(
      top.map((entry) => ({ ...entry, score: entry.score ?? 0, timeSpentSeconds: entry.timeSpentSeconds ?? 0, submittedAt: entry.submittedAt! })),
    ).map((entry) => ({
      rank: entry.rank,
      fullName: entry.user.fullName,
      score: entry.score,
      timeSpentSeconds: entry.timeSpentSeconds,
      isMe: entry.userId === this.userId,
    }));

    if (mine?.status === 'SUBMITTED' && mine.rank !== null && !leaderboard.some((row) => row.isMe)) {
      const me = await prisma.user.findUniqueOrThrow({ where: { id: this.userId }, select: { fullName: true } });
      const entry = await prisma.competitionEntry.findUniqueOrThrow({
        where: { competitionId_userId: { competitionId, userId: this.userId } },
        select: { timeSpentSeconds: true },
      });
      leaderboard.push({ rank: mine.rank, fullName: me.fullName, score: mine.score ?? 0, timeSpentSeconds: entry.timeSpentSeconds ?? 0, isMe: true });
    }

    const data: CompetitionDetail = { ...this.toListItem(competition, mine, now), leaderboard };
    return { success: true, data };
  }

  /** Starts the viewer's single entry, or resumes it if it already exists. */
  async startEntry(competitionId: string) {
    const competition = await this.findOrThrow(competitionId);
    const existing = await this.findMyEntry(competitionId);
    if (existing) return { success: true, data: await this.entryDetail(competition, existing) };

    if (competitionStatus(competition) !== 'ACTIVE') throw new CompetitionNotActiveException();

    let entry: EntryRow;
    try {
      entry = await prisma.competitionEntry.create({ data: { competitionId, userId: this.userId } });
    } catch (error) {
      // a double click or second tab lost the race to the unique (competitionId, userId) index: resume the winner
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
      entry = (await this.findMyEntry(competitionId))!;
    }

    return { success: true, data: await this.entryDetail(competition, entry) };
  }

  async myEntry(competitionId: string) {
    const competition = await this.findOrThrow(competitionId);
    const entry = await this.findMyEntry(competitionId);
    if (!entry) throw new CompetitionEntryNotFoundException();

    return { success: true, data: await this.entryDetail(competition, entry) };
  }

  async submitEntry(competitionId: string, input: SubmitCompetitionEntryInput) {
    const competition = await this.findOrThrow(competitionId);
    const entry = await this.findMyEntry(competitionId);
    if (!entry) throw new CompetitionEntryNotFoundException();
    if (entry.submittedAt) throw new AttemptAlreadySubmittedException(entry.id);

    const now = new Date();
    const deadline = entryDeadline(entry.startedAt, competition.durationMinutes, competition.endsAt);

    if (differenceInSeconds(now, deadline) > SUBMIT_GRACE_SECONDS) {
      await this.expire(competition, entry);
    } else {
      const questions = await loadFrozenQuestions(competition.questionIds);
      const allowed = new Set(competition.questionIds);
      const answers = Object.fromEntries(Object.entries(input.answers).filter(([questionId]) => allowed.has(questionId)));
      const { correctCount } = gradeAttempt(questions, answers);
      const allowedSeconds = differenceInSeconds(deadline, entry.startedAt);

      const { count } = await prisma.competitionEntry.updateMany({
        where: { id: entry.id, submittedAt: null },
        data: {
          answers: answers as Prisma.InputJsonValue,
          score: scoreOver(correctCount, competition.questionIds.length),
          correctCount,
          timeSpentSeconds: Math.max(0, Math.min(differenceInSeconds(now, entry.startedAt), allowedSeconds)),
          submittedAt: now,
        },
      });
      if (count === 0) throw new AttemptAlreadySubmittedException(entry.id);
    }

    const updated = await prisma.competitionEntry.findUniqueOrThrow({ where: { id: entry.id } });
    return { success: true, data: await this.entryDetail(competition, updated) };
  }

  /** Top-3 places in finished competitions; a zero score earns nothing even when alone. */
  async myBadges() {
    const now = new Date();
    const entries = await prisma.competitionEntry.findMany({
      where: { userId: this.userId, submittedAt: { not: null }, score: { gt: 0 }, competition: { endsAt: { lte: now } } },
      select: {
        competitionId: true,
        score: true,
        timeSpentSeconds: true,
        competition: { select: { title: true, endsAt: true, specialty: { select: { name: true } } } },
      },
      orderBy: { competition: { endsAt: 'desc' } },
    });

    const badges: CompetitionBadge[] = [];
    for (const entry of entries) {
      const rank = await this.rankOf(entry.competitionId, entry.score!, entry.timeSpentSeconds ?? 0);
      if (rank > BADGE_RANKS) continue;
      badges.push({
        competitionId: entry.competitionId,
        title: entry.competition.title as LocalizedText,
        specialtyName: entry.competition.specialty.name as LocalizedText,
        rank: rank as CompetitionBadge['rank'],
        endsAt: entry.competition.endsAt.toISOString(),
      });
    }

    return { success: true, data: badges };
  }

  // ─── admin ───────────────────────────────────────────────────────────────

  async adminList() {
    await this.ensureWeeklySafely();
    const competitions = await prisma.competition.findMany({ select: LIST_SELECT, orderBy: { startsAt: 'desc' }, take: ADMIN_LIST_LIMIT });
    const now = new Date();

    return { success: true, data: competitions.map((competition) => this.toListItem(competition, null, now)) };
  }

  async create(input: z.infer<typeof CreateCompetitionInputSchema>) {
    await this.specialtyService.assertExists(input.specialtyId);
    await this.topicService.assertBelongToSpecialty(input.topicIds, input.specialtyId);

    const pool = await prisma.question.findMany({
      where: publishedPoolWhere(input.specialtyId, input.topicIds),
      select: { id: true, difficulty: true },
    });
    if (pool.length < input.questionCount) throw new CompetitionNotEnoughQuestionsException(pool.length);

    const competition = await prisma.competition.create({
      data: {
        specialtyId: input.specialtyId,
        title: input.title,
        description: input.description ?? Prisma.DbNull,
        questionIds: pickQuestionIds(pool, input.questionCount, null),
        durationMinutes: input.durationMinutes,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
      },
      select: LIST_SELECT,
    });

    const data = this.toListItem(competition, null, new Date());
    await this.auditService.log({ ...this.actor, action: 'COMPETITION_CREATED', entityType: 'Competition', entityId: competition.id, after: data });

    return { success: true, data };
  }

  async delete(competitionId: string) {
    const competition = await this.findOrThrow(competitionId);
    const entries = await prisma.competitionEntry.count({ where: { competitionId } });
    if (entries > 0) throw new CompetitionHasEntriesException();

    await prisma.competition.delete({ where: { id: competitionId } });
    await this.auditService.log({
      ...this.actor,
      action: 'COMPETITION_DELETED',
      entityType: 'Competition',
      entityId: competitionId,
      before: this.toListItem(competition, null, new Date()),
    });

    return { success: true, data: null };
  }

  // ─── weekly ──────────────────────────────────────────────────────────────

  /** Creates this week's contest for every active specialty with enough published questions. Idempotent. */
  async ensureWeekly(now: Date = new Date()): Promise<number> {
    const window = weekWindow(now);
    const specialties = await prisma.specialty.findMany({
      where: { isActive: true, competitions: { none: { weekKey: window.weekKey } } },
      select: { id: true },
    });

    const data: Prisma.CompetitionCreateManyInput[] = [];
    for (const specialty of specialties) {
      const pool = await prisma.question.findMany({ where: publishedPoolWhere(specialty.id, []), select: { id: true, difficulty: true } });
      if (pool.length < WEEKLY.minPool) continue;

      data.push({
        specialtyId: specialty.id,
        title: WEEKLY.title,
        description: WEEKLY.description(window.weekKey),
        questionIds: pickQuestionIds(pool, WEEKLY.questionCount, null),
        durationMinutes: WEEKLY.durationMinutes,
        startsAt: window.startsAt,
        endsAt: window.endsAt,
        weekKey: window.weekKey,
      });
    }

    if (!data.length) return 0;
    const { count } = await prisma.competition.createMany({ data, skipDuplicates: true });
    return count;
  }

  /** Throttled so list requests don't re-scan specialties every time; never fails the caller. */
  private async ensureWeeklySafely(): Promise<void> {
    const { weekKey } = weekWindow(new Date());
    if (lastWeeklyCheck.weekKey === weekKey && Date.now() - lastWeeklyCheck.at < WEEKLY.recheckMs) return;

    try {
      const created = await this.ensureWeekly();
      lastWeeklyCheck = { weekKey, at: Date.now() };
      if (created) $log.info({ event: 'WEEKLY_COMPETITIONS_CREATED', weekKey, created });
    } catch (error) {
      $log.error({ event: 'WEEKLY_COMPETITIONS_FAILED', message: (error as Error).message });
    }
  }

  // ─── helpers ─────────────────────────────────────────────────────────────

  private async findOrThrow(competitionId: string): Promise<CompetitionRow> {
    const competition = await prisma.competition.findUnique({ where: { id: competitionId }, select: LIST_SELECT });
    if (!competition) throw new CompetitionNotFoundException(competitionId);
    return competition;
  }

  private findMyEntry(competitionId: string) {
    return prisma.competitionEntry.findUnique({ where: { competitionId_userId: { competitionId, userId: this.userId } } });
  }

  /** 1 + entries strictly better (higher score, or same score in less time); full ties share the place. */
  private async rankOf(competitionId: string, score: number, timeSpentSeconds: number): Promise<number> {
    const better = await prisma.competitionEntry.count({
      where: {
        competitionId,
        submittedAt: { not: null },
        OR: [{ score: { gt: score } }, { score, timeSpentSeconds: { lt: timeSpentSeconds } }],
      },
    });
    return better + 1;
  }

  /** Time ran out with no answers on record: close the entry at 0 so it can't be reopened later. */
  private async expire(competition: CompetitionRow, entry: EntryRow): Promise<void> {
    const deadline = entryDeadline(entry.startedAt, competition.durationMinutes, competition.endsAt);
    await prisma.competitionEntry.updateMany({
      where: { id: entry.id, submittedAt: null },
      data: { answers: Prisma.DbNull, score: 0, correctCount: 0, timeSpentSeconds: Math.max(0, differenceInSeconds(deadline, entry.startedAt)), submittedAt: deadline },
    });
  }

  private isOverdue(competition: CompetitionRow, entry: EntryRow, now: Date = new Date()): boolean {
    const deadline = entryDeadline(entry.startedAt, competition.durationMinutes, competition.endsAt);
    return !entry.submittedAt && differenceInSeconds(now, deadline) > SUBMIT_GRACE_SECONDS;
  }

  /** The viewer's entry per competition, closing ones whose time ran out so status and rank are final. */
  private async myEntriesFor(competitions: CompetitionRow[]): Promise<Map<string, MyCompetitionEntrySummary>> {
    const byId = new Map(competitions.map((competition) => [competition.id, competition]));
    let entries = await prisma.competitionEntry.findMany({
      where: { userId: this.userId, competitionId: { in: [...byId.keys()] } },
    });

    const overdue = entries.filter((entry) => this.isOverdue(byId.get(entry.competitionId)!, entry));
    if (overdue.length) {
      for (const entry of overdue) await this.expire(byId.get(entry.competitionId)!, entry);
      entries = await prisma.competitionEntry.findMany({ where: { userId: this.userId, competitionId: { in: [...byId.keys()] } } });
    }

    const result = new Map<string, MyCompetitionEntrySummary>();
    for (const entry of entries) {
      result.set(entry.competitionId, {
        status: entry.submittedAt ? 'SUBMITTED' : 'IN_PROGRESS',
        score: entry.score,
        rank: entry.submittedAt ? await this.rankOf(entry.competitionId, entry.score ?? 0, entry.timeSpentSeconds ?? 0) : null,
      });
    }

    return result;
  }

  private async entryDetail(competition: CompetitionRow, initial: EntryRow): Promise<CompetitionEntryDetail> {
    let entry = initial;
    if (this.isOverdue(competition, entry)) {
      await this.expire(competition, entry);
      entry = await prisma.competitionEntry.findUniqueOrThrow({ where: { id: entry.id } });
    }

    const questions = await loadFrozenQuestions(competition.questionIds);
    const title = competition.title as LocalizedText;

    if (!entry.submittedAt) {
      return {
        status: 'IN_PROGRESS',
        id: entry.id,
        competitionId: competition.id,
        title,
        deadline: entryDeadline(entry.startedAt, competition.durationMinutes, competition.endsAt).toISOString(),
        questions: questions.map(toAttemptQuestion),
      };
    }

    const answers = (entry.answers as Record<string, number> | null) ?? {};
    const [rank, participantCount] = await Promise.all([
      this.rankOf(competition.id, entry.score ?? 0, entry.timeSpentSeconds ?? 0),
      prisma.competitionEntry.count({ where: { competitionId: competition.id, submittedAt: { not: null } } }),
    ]);

    return {
      status: 'SUBMITTED',
      id: entry.id,
      competitionId: competition.id,
      title,
      score: entry.score ?? 0,
      correctCount: entry.correctCount ?? 0,
      questionCount: competition.questionIds.length,
      timeSpentSeconds: entry.timeSpentSeconds ?? 0,
      submittedAt: entry.submittedAt.toISOString(),
      // a normal submit always stores an answers object, so null marks an entry closed by the clock
      expired: entry.answers === null,
      rank,
      participantCount,
      topics: topicBreakdown(questions, answers),
      questions: questions.map((question) => toReviewQuestion(question, answers)),
    };
  }

  private toListItem(competition: CompetitionRow, myEntry: MyCompetitionEntrySummary | null, now: Date): CompetitionListItem {
    return {
      id: competition.id,
      title: competition.title as LocalizedText,
      description: (competition.description ?? null) as LocalizedText | null,
      specialtyId: competition.specialtyId,
      specialtyName: competition.specialty.name as LocalizedText,
      status: competitionStatus(competition, now),
      startsAt: competition.startsAt.toISOString(),
      endsAt: competition.endsAt.toISOString(),
      questionCount: competition.questionIds.length,
      durationMinutes: competition.durationMinutes,
      isWeekly: competition.weekKey !== null,
      participantCount: competition._count.entries,
      myEntry,
    };
  }
}
