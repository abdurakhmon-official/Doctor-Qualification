import type { AiStatusOutput, AnalysisKind, AttemptAnalysisOutput, Locale } from '@repo/contracts';
import { BaseService } from '@/lib/services/base.service';

export class AiService extends BaseService<never, never, never> {
  protected BASE_PATH = 'ai';

  async status(): Promise<AiStatusOutput> {
    return this.sendGet<AiStatusOutput>('/status');
  }

  /** null until the user asks for an analysis. */
  async analysis(kind: AnalysisKind, attemptId: string, locale: Locale): Promise<AttemptAnalysisOutput | null> {
    return this.sendGet<AttemptAnalysisOutput | null>(`/analysis/${kind}/${attemptId}`, { locale });
  }

  async generate(kind: AnalysisKind, attemptId: string, locale: Locale): Promise<AttemptAnalysisOutput> {
    return this.sendPost<AttemptAnalysisOutput, { locale: Locale }>(`/analysis/${kind}/${attemptId}`, { locale });
  }
}

export const aiService = new AiService();
