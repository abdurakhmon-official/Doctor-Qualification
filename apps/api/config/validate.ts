import config from '@/config';

// types

type CheckLevel = 'error' | 'warn';

// interfaces

interface Check {
  level: CheckLevel;
  message: string;
  fatal?: boolean;
}

const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL'] as const;

const WEAK_SECRETS = [
  'change-me-to-a-long-random-string',
  'secret',
  'jwtsecret',
  'changeme',
  'test',
];

const MIN_SECRET_LENGTH = 32;

export const validateConfig = (): Check[] => {
  const checks: Check[] = [];
  const isProduction = config.stage === 'production';

  for (const name of REQUIRED_ENV) {
    if (!process.env[name]) {
      checks.push({
        level: 'error',
        fatal: true,
        message: `${name} is not set — copy .env.sample to .env and fill it in`,
      });
    }
  }

  const secret = config.jwt.secret ?? '';

  if (secret) {
    if (WEAK_SECRETS.includes(secret.toLowerCase())) {
      checks.push({ level: 'error', message: 'JWT_SECRET still holds the sample value' });
    } else if (secret.length < MIN_SECRET_LENGTH) {
      checks.push({
        level: isProduction ? 'error' : 'warn',
        message: `JWT_SECRET is too short (${secret.length} characters, ${MIN_SECRET_LENGTH} required)`,
      });
    }
  }

  if (isProduction && config.cors.origin === '*') {
    checks.push({
      level: 'error',
      message: 'CORS_ORIGIN cannot be `*` in production — name the exact domain',
    });
  }

  if (isProduction && config.swagger.enabled) {
    checks.push({
      level: 'warn',
      message: 'Swagger is enabled in production — set SWAGGER_ENABLED=false',
    });
  }

  if (!config.AWS_S3_BUCKET) {
    checks.push({
      level: isProduction ? 'error' : 'warn',
      message: 'AWS_S3_BUCKET is not set — files are written to local disk and are lost on container restart',
    });
  }

  if (isProduction && config.AWS_ACCESS_KEY_ID) {
    checks.push({
      level: 'warn',
      message: 'AWS keys are set via environment variables — an IAM role is safer in production',
    });
  }

  if (isProduction && !config.mail.host) {
    checks.push({
      level: 'warn',
      message: 'MAIL_HOST is not set — password reset and verification mail will not be sent',
    });
  }

  if (isProduction && !config.redis.url.includes('://')) {
    checks.push({ level: 'error', message: 'REDIS_URL is not a valid connection string' });
  }

  if (isProduction && config.webUrl.includes('localhost')) {
    checks.push({ level: 'error', message: 'WEB_URL still points at localhost' });
  }

  return checks;
};

export const assertConfig = (): void => {
  const checks = validateConfig();
  if (checks.length === 0) return;

  const errors = checks.filter((check) => check.level === 'error');
  const warnings = checks.filter((check) => check.level === 'warn');

  for (const warning of warnings) {
    console.warn(`[config] warning: ${warning.message}`);
  }

  for (const error of errors) {
    console.error(`[config] ERROR: ${error.message}`);
  }

  const hasFatal = errors.some((check) => check.fatal);

  if (errors.length > 0 && (config.stage === 'production' || hasFatal)) {
    console.error(
      `\n[config] ${errors.length} critical issue(s) prevented the server from starting.\n` +
        'Fix the configuration and try again.\n',
    );
    process.exit(1);
  }
};
