import type {
  AdminExamDetail,
  AdminExamListItem,
  AdminExamQuery,
  CreateExamInput,
  CreateQuestionInput,
  QuestionOutput,
  UpdateExamInput,
} from '@repo/contracts';
import { BaseService, type Paged } from '@/lib/services/base.service';

export class ExamService extends BaseService<AdminExamDetail, CreateExamInput, UpdateExamInput> {
  protected BASE_PATH = 'exams';

  async list(query: Partial<AdminExamQuery> = {}): Promise<Paged<AdminExamListItem>> {
    return this.sendGetPaged<AdminExamListItem>('', query);
  }

  async createQuestion(examId: string, input: CreateQuestionInput): Promise<QuestionOutput> {
    return this.sendPost<QuestionOutput, CreateQuestionInput>(`/${examId}/questions`, input);
  }
}

export const examService = new ExamService();
