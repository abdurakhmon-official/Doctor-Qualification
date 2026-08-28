import { BadRequest, Forbidden, NotFound } from '@tsed/exceptions';

export class AttemptNotFoundException extends NotFound {
  readonly _code = 'ATTEMPT_NOT_FOUND';

  constructor(attemptId: string) {
    super(`Attempt ${attemptId} not found`);
  }
}

export class AttemptForbiddenException extends Forbidden {
  readonly _code = 'ATTEMPT_FORBIDDEN';

  constructor() {
    super('this attempt does not belong to you');
  }
}

export class AttemptAlreadySubmittedException extends BadRequest {
  readonly _code = 'ATTEMPT_ALREADY_SUBMITTED';

  constructor(attemptId: string) {
    super(`Attempt ${attemptId} has already been submitted`);
  }
}

export class AttemptTimeExpiredException extends BadRequest {
  readonly _code = 'ATTEMPT_TIME_EXPIRED';

  constructor() {
    super('the time allowed for this attempt has expired');
  }
}
