import type {
  PracticeAvailability,
  PracticeAvailabilityQuery,
  PracticeDetail,
  PracticeListItem,
  StartPracticeInput,
  SubmitPracticeInput,
} from '@repo/contracts';
import { BaseService } from '@/lib/services/base.service';

export class PracticeService extends BaseService<PracticeDetail, StartPracticeInput, never> {
  protected BASE_PATH = 'practice';

  async availability({ topicIds, ...query }: PracticeAvailabilityQuery): Promise<PracticeAvailability> {
    const ids = Array.isArray(topicIds) ? topicIds : topicIds ? [topicIds] : [];
    return this.sendGet<PracticeAvailability>('/availability', { ...query, topicIds: ids.length ? ids.join(',') : undefined });
  }

  async start(input: StartPracticeInput): Promise<PracticeDetail> {
    return this.sendPost<PracticeDetail, StartPracticeInput>('', input);
  }

  async submit(attemptId: string, input: SubmitPracticeInput): Promise<PracticeDetail> {
    return this.sendPut<PracticeDetail, SubmitPracticeInput>(`/${attemptId}/submit`, input);
  }

  async my(): Promise<PracticeListItem[]> {
    return this.sendGet<PracticeListItem[]>('/my');
  }
}

export const practiceService = new PracticeService();
