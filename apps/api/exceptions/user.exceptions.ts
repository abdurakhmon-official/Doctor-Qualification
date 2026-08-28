import { BadRequest, NotFound } from '@tsed/exceptions';

export class UserNotFoundException extends NotFound {
  readonly _code = 'AUTH_USER_NOT_FOUND';

  constructor(userId: string) {
    super(`User ${userId} not found`);
  }
}

export class AdminCannotModifySelfException extends BadRequest {
  readonly _code = 'ADMIN_CANNOT_MODIFY_SELF';

  constructor() {
    super("you cannot change your own account's role or active status");
  }
}
