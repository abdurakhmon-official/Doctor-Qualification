import { Controller, Inject } from '@tsed/di';
import { BodyParams } from '@tsed/platform-params';
import { Get, Post } from '@tsed/schema';
import { SigninInputSchema, SignupInputSchema } from '@/inputs/auth.input';
import type { SigninInput, SignupInput } from '@/inputs/auth.input';
import { Authorized, Authenticate } from '@/middlewares/auth.middleware';
import { RATE_LIMITS, RateLimit } from '@/middlewares/rate-limit.middleware';
import { AuthService } from '@/services/auth.service';

@Controller('/auth')
export class AuthController {
  @Inject()
  private authService!: AuthService;

  @Post('/signup')
  @RateLimit(RATE_LIMITS.auth)
  async signup(@BodyParams() body: SignupInput) {
    const data = SignupInputSchema.parse(body);
    return this.authService.signup(data);
  }

  @Post('/signin')
  @RateLimit(RATE_LIMITS.auth)
  async signin(@BodyParams() body: SigninInput) {
    const data = SigninInputSchema.parse(body);
    return this.authService.signin(data);
  }

  @Get('/me')
  @Authorized(Authenticate())
  async me() {
    return this.authService.me();
  }

  @Post('/logout')
  @Authorized(Authenticate())
  async logout() {
    return this.authService.logout();
  }
}
