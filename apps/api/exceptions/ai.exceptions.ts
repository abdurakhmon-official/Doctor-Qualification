import { BadRequest, ServiceUnavailable, TooManyRequests, UnprocessableEntity } from '@tsed/exceptions';

export class AiNotConfiguredException extends ServiceUnavailable {
  readonly _code = 'AI_NOT_CONFIGURED';

  constructor() {
    super('the AI assistant is not configured on this server');
  }
}

export class AiUnavailableException extends ServiceUnavailable {
  readonly _code = 'AI_UNAVAILABLE';

  constructor() {
    super('the AI assistant is temporarily unavailable');
  }
}

export class AiDailyLimitException extends TooManyRequests {
  readonly _code = 'AI_DAILY_LIMIT';

  constructor(limit: number) {
    super(`daily limit of ${limit} AI analyses reached`);
  }
}

export class AiAnalysisRefusedException extends UnprocessableEntity {
  readonly _code = 'AI_ANALYSIS_REFUSED';

  constructor() {
    super('the AI assistant declined to analyse this attempt');
  }
}

export class AiAttemptNotSubmittedException extends BadRequest {
  readonly _code = 'AI_ATTEMPT_NOT_SUBMITTED';

  constructor() {
    super('only finished attempts can be analysed');
  }
}

export class AiCompetitionRunningException extends BadRequest {
  readonly _code = 'AI_COMPETITION_RUNNING';

  constructor() {
    super('competition entries can be analysed once the competition has finished');
  }
}
