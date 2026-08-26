import { Inject, Injectable, InjectContext } from '@tsed/di';
import { PlatformContext } from '@tsed/common';
import type { Request } from 'express';
import prisma from '@/modules/db';
import { comparePassword, createAccessToken, hashPassword, needsRehash } from '@/modules/auth';
import { badRequest, notFound, unauthorized } from '@/utils/errors.utils';
import { clearLoginFailures, loginBlockedFor, LOGIN_GUARD, recordLoginFailure } from '@/utils/login-guard.utils';
import { TooManyRequests } from '@/middlewares/rate-limit.middleware';
import { TokenService } from '@/services/token.service';
import { USER_PUBLIC_SELECT } from '@/utils/constants';
import { USER_ROLE } from '../generated/prisma';
import type { SignupInput, SigninInput } from '@/inputs/auth.input';

@Injectable()
export class AuthService {
  @InjectContext()
  private context!: PlatformContext;

  @Inject()
  private tokenService!: TokenService;

  private get request() {
    return this.context.getRequest<Request>();
  }

  private get user() {
    return this.request.user;
  }

  async signup(input: SignupInput) {
    const email = input.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw badRequest('AUTH_EMAIL_TAKEN', 'This email is already registered');

    const user = await prisma.user.create({
      data: {
        fullName: input.fullName,
        email,
        password: await hashPassword(input.password),
        locale: input.locale,
        role: USER_ROLE.STUDENT,
      },
      select: USER_PUBLIC_SELECT,
    });

    return {
      success: true,
      _code: 'AUTH_SIGNED_UP',
      _message: 'Registered successfully',
      data: createAccessToken(user),
    };
  }

  async signin(input: SigninInput) {
    const email = input.email.toLowerCase();

    const blockedFor = await loginBlockedFor(email);
    if (blockedFor > 0) {
      throw new TooManyRequests(`too many failed attempts, try again in ${Math.ceil(blockedFor / 60)} minutes`, {
        retryAfter: blockedFor,
        limit: LOGIN_GUARD.MAX_FAILURES,
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.deletedAt) {
      await recordLoginFailure(email);
      throw badRequest('AUTH_INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const isValid = await comparePassword(input.password, user.password);

    if (!isValid) {
      await recordLoginFailure(email);
      throw badRequest('AUTH_INVALID_CREDENTIALS', 'Invalid email or password');
    }

    if (!user.active) {
      throw unauthorized('AUTH_ACCOUNT_INACTIVE', 'This account is inactive');
    }

    await clearLoginFailures(email);

    if (needsRehash(user.password)) {
      await this.rehashPassword(user.id, input.password);
    }

    return { success: true, data: createAccessToken(user) };
  }

  async me() {
    const user = await prisma.user.findUnique({
      where: { id: this.user?.id },
      select: USER_PUBLIC_SELECT,
    });

    if (!user || user.deletedAt) throw notFound('AUTH_USER_NOT_FOUND', 'User not found');

    return { success: true, data: { ...user, isAdmin: user.role === USER_ROLE.ADMIN } };
  }

  async logout() {
    const payload = this.request.auth;
    if (payload) await this.tokenService.revoke(payload);

    return { success: true, _code: 'AUTH_SIGNED_OUT', _message: 'Signed out' };
  }

  private async rehashPassword(userId: string, plainPassword: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { password: await hashPassword(plainPassword) },
      });
    } catch (error) {
      console.warn(`[auth] password rehash failed for ${userId}: ${(error as Error).message}`);
    }
  }
}
