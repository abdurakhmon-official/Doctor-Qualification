import { NotFound } from '@tsed/exceptions';

export class QuestionNotFoundException extends NotFound {
  readonly _code = 'QUESTION_NOT_FOUND';

  constructor(questionId: string) {
    super(`Question ${questionId} not found`);
  }
}
