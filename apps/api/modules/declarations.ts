import { PrismaClient, User } from '../generated/prisma';
import { AccessTokenPayload } from '@/modules/auth';
import type Redis from 'ioredis';

export type AuthenticatedUser = Omit<User, 'password'> & {
  isAdmin: boolean;
};

declare global {
  var __db: PrismaClient;
  var __redis: Redis;

  namespace Express {
    export interface Request {
      token?: string;
      user?: AuthenticatedUser;
      auth?: AccessTokenPayload;
    }
  }

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: string;
      PORT?: string;
      STAGE?: string;
      JWT_SECRET: string;
      JWT_EXPIRES_IN?: string;
      DATABASE_URL: string;
      CORS_ORIGIN?: string;
      SWAGGER_ENABLED?: string;
      SWAGGER_PATH?: string;

      REDIS_URL?: string;

      MAIL_HOST?: string;
      MAIL_PORT?: string;
      MAIL_USER?: string;
      MAIL_PASSWORD?: string;
      MAIL_FROM?: string;

      STRIPE_SECRET_KEY?: string;
      STRIPE_WEBHOOK_SECRET?: string;

      WEB_URL?: string;
      PUBLIC_URL?: string;
      SEED_ADMIN_EMAIL?: string;
      SEED_ADMIN_PASSWORD?: string;
    }
  }
}
