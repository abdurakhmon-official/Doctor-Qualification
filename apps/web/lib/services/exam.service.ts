import type {
  AdminExamDetail,
  AdminExamListItem,
  AdminExamQuery,
  ApiResponse,
  CreateExamInput,
  CreateQuestionInput,
  ExamOutput,
  ImportQuestionsInput,
  ImportQuestionsOutput,
  QuestionOutput,
  UpdateExamInput,
} from '@repo/contracts';
import { BaseService, type Paged } from '@/lib/services/base.service';
import api from '@/lib/axios';

export class ExamService extends BaseService<AdminExamDetail, CreateExamInput, UpdateExamInput> {
  protected BASE_PATH = 'exams';

  async list(query: Partial<AdminExamQuery> = {}): Promise<Paged<AdminExamListItem>> {
    return this.sendGetPaged<AdminExamListItem>('', query);
  }

  async createQuestion(examId: string, input: CreateQuestionInput): Promise<QuestionOutput> {
    return this.sendPost<QuestionOutput, CreateQuestionInput>(`/${examId}/questions`, input);
  }

  async importQuestions(examId: string, input: ImportQuestionsInput): Promise<ImportQuestionsOutput> {
    return this.sendPost<ImportQuestionsOutput, ImportQuestionsInput>(`/${examId}/questions/import`, input);
  }

  async listPublished(specialtyId?: string): Promise<ExamOutput[]> {
    const { data } = await api.get<ApiResponse<ExamOutput[]>>(`/${this.BASE_PATH}/published`, { params: { specialtyId } });
    return data.data;
  }
}

export const examService = new ExamService();
