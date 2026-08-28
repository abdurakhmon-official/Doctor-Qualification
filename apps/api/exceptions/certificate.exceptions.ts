import { NotFound } from '@tsed/exceptions';

export class CertificateNotFoundException extends NotFound {
  readonly _code = 'CERTIFICATE_NOT_FOUND';

  constructor(identifier: string) {
    super(`Certificate ${identifier} not found`);
  }
}
