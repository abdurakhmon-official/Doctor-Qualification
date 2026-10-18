import { BadRequest } from '@tsed/exceptions';

export class PracticeNoQuestionsException extends BadRequest {
  readonly _code = 'PRACTICE_NO_QUESTIONS';

  constructor() {
    super('no questions match the selected practice filters');
  }
}
