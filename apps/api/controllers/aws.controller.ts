import type { Response } from 'express';
import { Res } from '@tsed/common';
import { Controller, Inject } from '@tsed/di';
import { MulterOptions, MultipartFile, type PlatformMulterFile } from '@tsed/platform-multer';
import { PathParams, QueryParams } from '@tsed/platform-params';
import { Get, Post } from '@tsed/schema';
import { Authenticate, Authorized } from '@/middlewares/auth.middleware';
import { RateLimit, RATE_LIMITS } from '@/middlewares/rate-limit.middleware';
import { S3Service } from '@/services/s3.service';
import { MAX_UPLOAD_BYTES } from '@/utils/constants';

@Controller('/s3')
export class AwsController {
  @Inject()
  private s3Service!: S3Service;

  @Get('/file/*key')
  async sign(
    @PathParams('key') allParams: string[],
    @QueryParams('attachment') attachment: boolean,
    @QueryParams('fileName') fileName: string,
    @Res() res: Response,
  ) {
    const url = await this.s3Service.sign(allParams, fileName, attachment);
    res.redirect(url);
  }

  @Get('/generate-policy')
  @Authorized(Authenticate())
  @RateLimit(RATE_LIMITS.upload)
  async generatePolicy(
    @QueryParams('folder') folder: string,
    @QueryParams('contentType') contentType: string,
    @QueryParams('filename') filename: string,
    @QueryParams('size') size: number,
  ) {
    return this.s3Service.generatePolicy(folder, contentType, filename, Number(size));
  }

  @Post('/:folder/upload')
  @Authorized(Authenticate())
  @RateLimit(RATE_LIMITS.upload)
  @MulterOptions({ limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } })
  async upload(
    @PathParams('folder') folder: string,
    @MultipartFile('file') file: PlatformMulterFile,
  ) {
    return this.s3Service.upload(folder, file);
  }
}
