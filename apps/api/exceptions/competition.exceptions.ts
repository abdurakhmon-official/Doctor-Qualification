import { BadRequest, NotFound } from '@tsed/exceptions';

export class CompetitionNotFoundException extends NotFound {
  readonly _code = 'COMPETITION_NOT_FOUND';

  constructor(competitionId: string) {
    super(`Competition ${competitionId} not found`);
  }
}

export class CompetitionNotActiveException extends BadRequest {
  readonly _code = 'COMPETITION_NOT_ACTIVE';

  constructor() {
    super('this competition is not running right now');
  }
}

export class CompetitionEntryNotFoundException extends NotFound {
  readonly _code = 'COMPETITION_ENTRY_NOT_FOUND';

  constructor() {
    super('you have not entered this competition');
  }
}

export class CompetitionHasEntriesException extends BadRequest {
  readonly _code = 'COMPETITION_HAS_ENTRIES';

  constructor() {
    super('a competition with participants cannot be deleted');
  }
}

export class CompetitionNotEnoughQuestionsException extends BadRequest {
  readonly _code = 'COMPETITION_NOT_ENOUGH_QUESTIONS';

  constructor(available: number) {
    super(`only ${available} published questions match these settings`);
  }
}
