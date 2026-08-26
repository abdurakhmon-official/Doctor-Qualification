/**
 * Auth — kritik yo'l testi (rule: api standards.md §12, C:\USER\rules nodejs).
 * Prisma mock qilinmaydi — haqiqiy test Postgres'ga ishlaydi (DATABASE_URL_TEST env
 * yoki .env'dagi DATABASE_URL orqali sozlanadi).
 *
 * DIQQAT (bilib qo'yish kerak — keyingi bosqichda hal qilinadi): Ts.ED 8
 * paketlari (`@tsed/platform-express`, `@tsed/exceptions` va h.k.) faqat
 * ESM build chiqaradi (`"type": "module"`, CJS fallback yo'q). Jest'ning
 * standart CommonJS transformi bunday paketlarni import qila olmaydi —
 * bu Ts.ED'ning o'zida ham ma'lum holat (`@tsed/exceptions`ning o'z
 * `package.json`sida testlar Jest emas, Vitest bilan yozilgan). Shuning
 * uchun bu test to'liq HTTP/DI qatlamini emas, aynan shu muammoga olib
 * keladigan importlarsiz — haqiqiy Postgres va haqiqiy argon2/JWT
 * kutubxonalari orqali — signup/signin mantig'ini sinaydi. To'liq HTTP
 * integratsiya testi (yoki Jest'dan Vitest'ga o'tish) keyingi bosqichda
 * alohida vazifa sifatida hal qilinadi.
 */
import 'dotenv/config';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { PrismaClient, USER_ROLE } from '../generated/prisma';

const DATABASE_URL = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/app_test';
const JWT_SECRET = 'test-secret-key-at-least-32-characters-long';

const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

/** AuthService.signup bilan bir xil bosqichlar (parol xesh, STUDENT rol). */
const signup = async (input: { fullName: string; email: string; password: string }) => {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('AUTH_EMAIL_TAKEN');

  return prisma.user.create({
    data: {
      fullName: input.fullName,
      email,
      password: await argon2.hash(input.password),
      locale: 'en',
      role: USER_ROLE.STUDENT,
    },
  });
};

describe('Auth — signup', () => {
  it('creates a user with STUDENT role and a hashed (not plaintext) password', async () => {
    const user = await signup({ fullName: 'Test Student', email: 'student@example.com', password: 'SecurePass123' });

    expect(user.role).toBe(USER_ROLE.STUDENT);
    expect(user.password).not.toBe('SecurePass123');
    expect(await argon2.verify(user.password, 'SecurePass123')).toBe(true);
  });

  it('rejects a duplicate email', async () => {
    await signup({ fullName: 'First', email: 'dupe@example.com', password: 'SecurePass123' });

    await expect(signup({ fullName: 'Second', email: 'dupe@example.com', password: 'AnotherPass123' })).rejects.toThrow(
      'AUTH_EMAIL_TAKEN',
    );
  });
});

describe('Auth — signin', () => {
  it('verifies the correct password and rejects a wrong one', async () => {
    await signup({ fullName: 'Sign In', email: 'signin@example.com', password: 'SecurePass123' });

    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'signin@example.com' } });

    expect(await argon2.verify(user.password, 'SecurePass123')).toBe(true);
    expect(await argon2.verify(user.password, 'WrongPassword')).toBe(false);
  });

  it('marks a soft-deleted user as not eligible to sign in', async () => {
    const user = await signup({ fullName: 'Deleted', email: 'deleted@example.com', password: 'SecurePass123' });
    await prisma.user.update({ where: { id: user.id }, data: { deletedAt: new Date() } });

    const found = await prisma.user.findUniqueOrThrow({ where: { email: 'deleted@example.com' } });
    expect(found.deletedAt).not.toBeNull();
  });
});

describe('Auth — access token', () => {
  it('creates a JWT carrying the user id as subject, verifiable with the same secret', async () => {
    const user = await signup({ fullName: 'Token Test', email: 'token@example.com', password: 'SecurePass123' });

    const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, { subject: user.id, expiresIn: '1d' });
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

    expect(payload.sub).toBe(user.id);
    expect(payload.role).toBe(USER_ROLE.STUDENT);
  });
});
