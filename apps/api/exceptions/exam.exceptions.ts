import { BadRequest, NotFound } from '@tsed/exceptions';

export class ExamNotFoundException extends NotFound {
  readonly _code = 'EXAM_NOT_FOUND';

  constructor(examId: string) {
    super(`Exam ${examId} not found`);
  }
}

export class ExamHasNoQuestionsException extends BadRequest {
  readonly _code = 'EXAM_HAS_NO_QUESTIONS';

  constructor(examId: string) {
    super(`Exam ${examId} has no questions`);
  }
}
