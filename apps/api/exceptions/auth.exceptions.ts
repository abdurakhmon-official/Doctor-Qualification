import { BadRequest, Forbidden, Unauthorized } from '@tsed/exceptions';

export class AuthenticationRequiredException extends Unauthorized {
  readonly _code = 'AUTH_UNAUTHORIZED';

  constructor() {
    super('authentication required');
  }
}

export class EmailAlreadyTakenException extends BadRequest {
  readonly _code = 'AUTH_EMAIL_TAKEN';

  constructor() {
    super('This email is already registered');
  }
}

export class InvalidCredentialsException extends BadRequest {
  readonly _code = 'AUTH_INVALID_CREDENTIALS';

  constructor() {
    super('Invalid email or password');
  }
}

export class AccountInactiveException extends Unauthorized {
  readonly _code = 'AUTH_ACCOUNT_INACTIVE';

  constructor() {
    super('This account is inactive');
  }
}

export class SessionRevokedException extends Unauthorized {
  readonly _code = 'AUTH_SESSION_REVOKED';

  constructor() {
    super('Session has been terminated. Please sign in again.');
  }
}

export class AccountDeactivatedException extends Forbidden {
  readonly _code = 'AUTH_ACCOUNT_DEACTIVATED';

  constructor() {
    super('Your account has been deactivated. Please contact an administrator.');
  }
}

export class InsufficientRoleException extends Forbidden {
  readonly _code = 'AUTH_FORBIDDEN';

  constructor() {
    super('You are not authorized to access this resource.');
  }
}
