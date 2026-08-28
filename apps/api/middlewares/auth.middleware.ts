import { Req } from '@tsed/common';
import { Context } from '@tsed/platform-params';
import { Middleware, MiddlewareMethods, UseAuth } from '@tsed/platform-middlewares';
import { Inject } from '@tsed/di';
import { useDecorators } from '@tsed/core';
import { Returns, Security } from '@tsed/schema';
import { Request } from 'express';
import { USER_ROLE } from '../generated/prisma';
import prisma from '@/modules/db';
import { Authenticate, verifyJWT } from '@/modules/auth';
import { TokenService } from '@/services/token.service';
import { USER_PUBLIC_SELECT, RoleRequirements } from '@/utils/constants';
import {
  AccountDeactivatedException,
  AuthenticationRequiredException,
  InsufficientRoleException,
  SessionRevokedException,
} from '@/exceptions/auth.exceptions';

@Middleware()
export class AuthMiddleware implements MiddlewareMethods {
  @Inject()
  private tokenService!: TokenService;

  public async use(@Req() request: Req, @Context() ctx: Context) {
    const options: RoleRequirements = ctx.endpoint.get(AuthMiddleware) || { role: null };

    await this.resolveUser(request as unknown as Request);

    const user = request.user;

    if (!user) {
      throw new AuthenticationRequiredException();
    }

    if (user.role === USER_ROLE.ADMIN) {
      return true;
    }

    if (options.role && user.role !== options.role) {
      throw new InsufficientRoleException();
    }

    return true;
  }

  private async resolveUser(request: Request) {
    const clientToken = request.token;

    if (!clientToken) {
      throw new AuthenticationRequiredException();
    }

    const payload = verifyJWT(clientToken);

    if (await this.tokenService.isRevoked(payload.jti)) {
      throw new SessionRevokedException();
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: USER_PUBLIC_SELECT,
    });

    if (!user || user.deletedAt) {
      throw new AuthenticationRequiredException();
    }

    if (!user.active) {
      throw new AccountDeactivatedException();
    }

    request.user = { ...user, isAdmin: user.role === USER_ROLE.ADMIN };
    request.auth = payload;
  }
}

@Middleware()
export class OptionalAuthMiddleware implements MiddlewareMethods {
  @Inject()
  private tokenService!: TokenService;

  public async use(@Req() request: Req) {
    const req = request as unknown as Request;
    if (!req.token) return true;

    try {
      const payload = verifyJWT(req.token);
      if (await this.tokenService.isRevoked(payload.jti)) return true;

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: USER_PUBLIC_SELECT,
      });

    } catch {
    }

    return true;
  }
}


export { Authenticate };
export type { RoleRequirements };

export const AdminOnly = (): RoleRequirements => Authenticate(USER_ROLE.ADMIN);

export const UserOnly = (): RoleRequirements => Authenticate(USER_ROLE.USER);

export const Authorized = (options: RoleRequirements = { role: null }): MethodDecorator => {
  return useDecorators(
    UseAuth(AuthMiddleware, options),
    Security('bearerAuth'),
    Returns(401).Description('missing, invalid or revoked access token'),
    Returns(403).Description('authenticated but not allowed to perform this action'),
  );
}
