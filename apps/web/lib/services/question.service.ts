import type { QuestionOutput, UpdateQuestionInput } from '@repo/contracts';
import { BaseService } from '@/lib/services/base.service';

export class QuestionService extends BaseService<QuestionOutput, never, UpdateQuestionInput> {
  protected BASE_PATH = 'questions';
}

export const questionService = new QuestionService();
