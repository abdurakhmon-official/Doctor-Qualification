import { NotFound } from '@tsed/exceptions';

export class SpecialtyNotFoundException extends NotFound {
  readonly _code = 'SPECIALTY_NOT_FOUND';

  constructor(specialtyId: string) {
    super(`Specialty ${specialtyId} not found`);
  }
}
