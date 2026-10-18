import type { AdminQuestionListItem, AdminQuestionQuery, QuestionOutput, UpdateQuestionInput } from '@repo/contracts';
import { BaseService, type Paged } from '@/lib/services/base.service';

export class QuestionService extends BaseService<QuestionOutput, never, UpdateQuestionInput> {
  protected BASE_PATH = 'questions';

  async list(query: Partial<AdminQuestionQuery> = {}): Promise<Paged<AdminQuestionListItem>> {
    return this.sendGetPaged<AdminQuestionListItem>('', query);
  }
}

export const questionService = new QuestionService();
