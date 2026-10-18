import type {
  CompetitionBadge,
  CompetitionDetail,
  CompetitionEntryDetail,
  CompetitionListItem,
  CreateCompetitionInput,
  SubmitCompetitionEntryInput,
} from '@repo/contracts';
import { BaseService } from '@/lib/services/base.service';

export class CompetitionService extends BaseService<CompetitionDetail, CreateCompetitionInput, never> {
  protected BASE_PATH = 'competitions';

  async list(): Promise<CompetitionListItem[]> {
    return this.sendGet<CompetitionListItem[]>('');
  }

  async adminList(): Promise<CompetitionListItem[]> {
    return this.sendGet<CompetitionListItem[]>('/admin');
  }

  async myBadges(): Promise<CompetitionBadge[]> {
    return this.sendGet<CompetitionBadge[]>('/my/badges');
  }

  async myEntry(competitionId: string): Promise<CompetitionEntryDetail> {
    return this.sendGet<CompetitionEntryDetail>(`/${competitionId}/entry`);
  }

  async startEntry(competitionId: string): Promise<CompetitionEntryDetail> {
    return this.sendPost<CompetitionEntryDetail, Record<string, never>>(`/${competitionId}/entry`, {});
  }

  async submitEntry(competitionId: string, input: SubmitCompetitionEntryInput): Promise<CompetitionEntryDetail> {
    return this.sendPut<CompetitionEntryDetail, SubmitCompetitionEntryInput>(`/${competitionId}/entry/submit`, input);
  }
}

export const competitionService = new CompetitionService();
