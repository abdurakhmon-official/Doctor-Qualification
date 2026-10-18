import { BadRequest, NotFound } from '@tsed/exceptions';

export class TopicNotFoundException extends NotFound {
  readonly _code = 'TOPIC_NOT_FOUND';

  constructor(topicId: string) {
    super(`Topic ${topicId} not found`);
  }
}

export class TopicSpecialtyMismatchException extends BadRequest {
  readonly _code = 'TOPIC_SPECIALTY_MISMATCH';

  constructor(topicId: string) {
    super(`Topic ${topicId} does not belong to the exam's specialty`);
  }
}
