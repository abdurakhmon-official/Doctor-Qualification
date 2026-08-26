import type { ApiResponse, AttemptDetail, MyAttemptListItem, StartAttemptInput, SubmitAttemptInput, SubmitAttemptResult } from '@repo/contracts';
import { BaseService } from '@/lib/services/base.service';
import api from '@/lib/axios';

export class ExamAttemptService extends BaseService<AttemptDetail, never, never> {
  protected BASE_PATH = 'exam-attempts';

  async start(input: StartAttemptInput): Promise<AttemptDetail> {
    return this.sendPost<AttemptDetail, StartAttemptInput>('', input);
  }

  async submit(attemptId: string, input: SubmitAttemptInput): Promise<SubmitAttemptResult> {
    return this.sendPut<SubmitAttemptResult, SubmitAttemptInput>(`/${attemptId}/submit`, input);
  }

  async myAttempts(): Promise<MyAttemptListItem[]> {
    const { data } = await api.get<ApiResponse<MyAttemptListItem[]>>(`/${this.BASE_PATH}/my`);
    return data.data;
  }
}

export const examAttemptService = new ExamAttemptService();
