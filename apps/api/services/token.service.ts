import { Injectable } from '@tsed/di';
import { AccessTokenPayload } from '@/modules/auth';
import { isRedisReady, redis } from '@/modules/redis';

@Injectable()
export class TokenService {
  private static readonly PREFIX = 'revoked:';
  private static readonly MAX_LOCAL_ENTRIES = 10_000;
  private static readonly SWEEP_INTERVAL_MS = 5 * 60 * 1000;

  private readonly local = new Map<string, number>();
  private sweeper?: NodeJS.Timeout;

  $onInit() {
    this.sweeper = setInterval(() => this.sweep(), TokenService.SWEEP_INTERVAL_MS);
    this.sweeper.unref();
  }

  $onDestroy() {
    if (this.sweeper) clearInterval(this.sweeper);
  }

  async revoke(payload: Pick<AccessTokenPayload, 'jti' | 'exp'>): Promise<void> {
    if (!payload.jti) return;

    const ttl = payload.exp - this.now();
    if (ttl <= 0) return;

    if (isRedisReady()) {
      try {
        await redis.set(TokenService.PREFIX + payload.jti, '1', 'EX', ttl);
        return;
      } catch {
        
      }
    }

    this.remember(payload.jti, payload.exp);
  }

  async isRevoked(jti?: string): Promise<boolean> {
    if (!jti) return false;

    if (isRedisReady()) {
      try {
        if ((await redis.exists(TokenService.PREFIX + jti)) === 1) return true;
      } catch {
        
      }
    }

    const expiresAt = this.local.get(jti);
    if (expiresAt === undefined) return false;

    if (expiresAt <= this.now()) {
      this.local.delete(jti);
      return false;
    }

    return true;
  }

  private remember(jti: string, expiresAt: number) {
    if (this.local.size >= TokenService.MAX_LOCAL_ENTRIES) {
      const oldest = this.local.keys().next().value;
      if (oldest !== undefined) this.local.delete(oldest);
    }

    this.local.set(jti, expiresAt);
  }

  private sweep() {
    const now = this.now();

    for (const [jti, expiresAt] of this.local) {
      if (expiresAt <= now) this.local.delete(jti);
    }
  }

  private now() {
    return Math.floor(Date.now() / 1000);
  }
}
