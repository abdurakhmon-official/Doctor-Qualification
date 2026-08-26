import { extname } from 'node:path';
import { PlatformContext } from '@tsed/common';
import { Inject, Injectable, InjectContext } from '@tsed/di';
import { BadRequest, Forbidden, NotFound } from '@tsed/exceptions';
import type { Request } from 'express';
import type { PlatformMulterFile } from '@tsed/platform-multer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { format } from 'date-fns';
import config from '@/config';
import { USER_ROLE } from '../generated/prisma';
import {
  assetUrl,
  deleteObjects,
  objectSize,
  presignDownload,
  putObject,
  s3Client,
  storageDriver,
} from '@/modules/storage';
import { uuid } from '@/utils';
import { badRequest } from '@/utils/errors.utils';
import {
  ALLOWED_MIME_BY_FOLDER,
  MAX_UPLOAD_BYTES_BY_FOLDER,
  READABLE_ASSET_FOLDERS,
  ReadableAssetFolder,
  UPLOAD_FOLDERS,
  UPLOAD_MIME_TYPES,
  UploadFolder,
} from '@/utils/constants';

@Injectable()
export class S3Service {
  private static readonly UPLOAD_URL_EXPIRY = 15 * 60;
  private static readonly SELF_SERVICE_FOLDERS: UploadFolder[] = ['avatar'];
  private static readonly AUTHENTICATED_FOLDERS: UploadFolder[] = ['document'];
  private static readonly DEFAULT_EXTENSIONS: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/avif': '.avif',
    'application/pdf': '.pdf',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'text/plain': '.txt',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/zip': '.zip',
    'application/x-zip-compressed': '.zip',
  };

  @InjectContext()
  private context!: PlatformContext;

  private get user() {
    return this.context?.getRequest<Request>()?.user;
  }

  async sign(allParams: string[] | string, fileName?: string, attachment?: boolean) {
    const segments = this.assertReadableKey(allParams);
    const key = segments.join('/');

    return presignDownload(key, {
      attachment: Boolean(attachment),
      filename: fileName || segments[segments.length - 1],
    });
  }

  async generatePolicy(folder: string, contentType: string, fileName: string, size: number) {
    this.assertFolder(folder);
    this.assertMayWrite(folder as UploadFolder);
    this.assertConfigured();

    const mimeType = decodeURIComponent(contentType || '').split(';')[0].trim().toLowerCase();
    if (!UPLOAD_MIME_TYPES[mimeType]) {
      throw new BadRequest(`unsupported file type: ${contentType}`);
    }
    this.assertMimeAllowedForFolder(folder as UploadFolder, mimeType);

    const contentLength = Number(size);
    if (!Number.isInteger(contentLength) || contentLength <= 0) {
      throw new BadRequest('file size is required');
    }

    const maxBytes = MAX_UPLOAD_BYTES_BY_FOLDER[folder as UploadFolder];
    if (contentLength > maxBytes) {
      throw new BadRequest(`file is larger than ${this.readableLimit(folder as UploadFolder)}`);
    }

    const extension =
      extname(fileName || '').toLowerCase() ||
      S3Service.DEFAULT_EXTENSIONS[mimeType] ||
      '';
    const key = `${folder}/${format(new Date(), 'yyyyMMdd')}/${uuid()}${extension}`;

    const command = new PutObjectCommand({
      Bucket: config.AWS_S3_BUCKET,
      Key: key,
      ContentType: mimeType,
      ContentLength: contentLength,
    });

    const uploadUrl = await getSignedUrl(s3Client(), command, {
      expiresIn: S3Service.UPLOAD_URL_EXPIRY,
      signableHeaders: new Set(['content-length', 'content-type']),
    });

    return {
      success: true,
      data: {
        method: 'PUT' as const,
        uploadUrl,
        headers: { 'Content-Type': mimeType, 'Content-Length': String(contentLength) },
        key,
        url: assetUrl(key),
        expiresIn: S3Service.UPLOAD_URL_EXPIRY,
        maxBytes,
      },
    };
  }

  async upload(folder: string, file?: PlatformMulterFile) {
    if (!file) throw new BadRequest('file is required');

    this.assertFolder(folder);
    this.assertMayWrite(folder as UploadFolder);

    if (folder === 'lesson-video') {
      throw new BadRequest('use /generate-policy for video uploads, not this endpoint');
    }

    const mimeType = file.mimetype?.split(';')[0].trim().toLowerCase() ?? '';
    if (!UPLOAD_MIME_TYPES[mimeType]) {
      throw new BadRequest(`unsupported file type: ${file.mimetype}`);
    }
    this.assertMimeAllowedForFolder(folder as UploadFolder, mimeType);

    if (file.size > MAX_UPLOAD_BYTES_BY_FOLDER[folder as UploadFolder]) {
      throw new BadRequest(`file is larger than ${this.readableLimit(folder as UploadFolder)}`);
    }

    const extension =
      extname(file.originalname || '').toLowerCase() ||
      S3Service.DEFAULT_EXTENSIONS[mimeType] ||
      '';
    const key = `${folder}/${format(new Date(), 'yyyyMMdd')}/${uuid()}${extension}`;

    await putObject(key, file.buffer, mimeType);

    return {
      success: true,
      _code: 'FILE_UPLOADED',
      _message: 'file uploaded',
      data: {
        key,
        url: assetUrl(key),
        originalName: file.originalname || key,
        mimeType,
        size: file.size,
      },
    };
  }

  putObject(key: string, body: Buffer, contentType?: string) {
    return putObject(key, body, contentType);
  }

  signUrl(key: string, options: { attachment?: boolean; expiresIn?: number; filename?: string } = {}) {
    return presignDownload(key, options);
  }

  deleteObjects(keys: string[]) {
    return deleteObjects(keys);
  }

  assetUrl(key: string) {
    return assetUrl(key);
  }

  private assertReadableKey(allParams: string[] | string): string[] {
    const segments = (Array.isArray(allParams) ? allParams : [allParams]).flatMap((segment) =>
      String(segment ?? '').split('/'),
    );

    const malformed =
      segments.length < 2 ||
      !READABLE_ASSET_FOLDERS.includes(segments[0] as ReadableAssetFolder) ||
      segments.some(
        (segment) => !segment || segment === '.' || segment === '..' || /[\\\0]/.test(segment),
      );

    if (malformed) throw new NotFound('file not found');

    return segments;
  }

  private assertFolder(folder: string): void {
    if (!UPLOAD_FOLDERS.includes(folder as UploadFolder)) {
      throw new BadRequest(`folder must be one of: ${UPLOAD_FOLDERS.join(', ')}`);
    }
  }

  private assertMayWrite(folder: UploadFolder): void {
    if (S3Service.SELF_SERVICE_FOLDERS.includes(folder)) return;
    if (this.user?.role === USER_ROLE.ADMIN) return;
    if (S3Service.AUTHENTICATED_FOLDERS.includes(folder) && this.user) return;

    throw new Forbidden('admin access required');
  }

  private assertMimeAllowedForFolder(folder: UploadFolder, mimeType: string): void {
    if (!ALLOWED_MIME_BY_FOLDER[folder].includes(mimeType)) {
      throw badRequest('UPLOAD_MIME_NOT_ALLOWED_FOR_FOLDER', `mime type not allowed for folder ${folder}`);
    }
  }

  private assertConfigured(): void {
    if (storageDriver() !== 's3') {
      throw new BadRequest('file storage is not configured on the server — set AWS_S3_BUCKET');
    }
  }

  private readableLimit(folder: UploadFolder): string {
    return `${Math.floor(MAX_UPLOAD_BYTES_BY_FOLDER[folder] / (1024 * 1024))} MB`;
  }
}
