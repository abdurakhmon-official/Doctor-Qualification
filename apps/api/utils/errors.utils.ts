import { BadRequest, Forbidden, NotFound, PaymentRequired, Unauthorized } from '@tsed/exceptions';

type CodedException = BadRequest | NotFound | Unauthorized | Forbidden | PaymentRequired;

const withCode = <T extends CodedException>(Ctor: new (message: string) => T, code: string, message: string): T => {
  const exception = new Ctor(message);
  (exception as T & { _code: string })._code = code;
  return exception;
};

export const badRequest = (code: string, message: string): BadRequest => withCode(BadRequest, code, message);

export const notFound = (code: string, message: string): NotFound => withCode(NotFound, code, message);

export const unauthorized = (code: string, message: string): Unauthorized => withCode(Unauthorized, code, message);

export const forbidden = (code: string, message: string): Forbidden => withCode(Forbidden, code, message);

export const paymentRequired = (code: string, message: string): PaymentRequired => withCode(PaymentRequired, code, message);

export const requireUserId = (user: { id: string } | undefined): string => {
  if (!user) throw unauthorized('AUTH_UNAUTHORIZED', 'authentication required');
  return user.id;
};
