import { BadRequest } from '@tsed/exceptions';

export class UploadMimeNotAllowedException extends BadRequest {
  readonly _code = 'UPLOAD_MIME_NOT_ALLOWED_FOR_FOLDER';

  constructor(message: string) {
    super(message);
  }
}
