import { isRedisReady, redis } from '@/modules/redis';

export const LOGIN_GUARD = {
  MAX_FAILURES: 5,
  WINDOW_SECONDS: 15 * 60,
} as const;

const KEY_PREFIX = 'login-fail:';

export const recordLoginFailure = async (email: string): Promise<void> => {
  if (!isRedisReady()) return;

  const key = KEY_PREFIX + email;

  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, LOGIN_GUARD.WINDOW_SECONDS);
  } catch {
  }
};

export const clearLoginFailures = async (email: string): Promise<void> => {
  if (!isRedisReady()) return;

  try {
    await redis.del(KEY_PREFIX + email);
  } catch {
  }
};

export const loginBlockedFor = async (email: string): Promise<number> => {
  if (!isRedisReady()) return 0;

  try {
    const key = KEY_PREFIX + email;
    const count = Number((await redis.get(key)) ?? 0);
    if (count < LOGIN_GUARD.MAX_FAILURES) return 0;

    const ttl = await redis.ttl(key);
    return ttl > 0 ? ttl : 0;
  } catch {
    return 0;
  }
};
