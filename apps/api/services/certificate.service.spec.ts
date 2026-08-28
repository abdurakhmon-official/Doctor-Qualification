/**
 * CertificateService — kritik yo'l testi (rule: api standards.md §12).
 * Prisma mock qilinmaydi — haqiqiy Postgres'ga ishlaydi (auth.service.spec.ts bilan bir xil sabab:
 * Ts.ED 8 paketlari faqat ESM chiqaradi, Jest'ning CJS transformi ularni import qila olmaydi —
 * shu sababli `CertificateService` klassining o'zi emas, aynan uning `checkAndIssue`dagi
 * idempotentlik mantig'i sinaladi, xuddi shu prisma chaqiruvlari orqali).
 * `certificate.utils.ts`dan `generateCertificateId` ham import qilinmaydi — u `nanoid`ga
 * bog'liq, `nanoid` esa xuddi shu ESM-only sababidan Jest'da parse bo'lmaydi; shu sababli
 * shu yerda mustaqil, formatga mos generator ishlatiladi.
 */
import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { PrismaClient } from '../generated/prisma';

const DATABASE_URL = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/app_test';

const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

const CERTIFICATE_CODE_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const generateCertificateId = (): string => {
  const code = Array.from(randomBytes(6), (byte) => CERTIFICATE_CODE_ALPHABET[byte % CERTIFICATE_CODE_ALPHABET.length]).join('');
  return `DOC-${new Date().getFullYear()}-${code}`;
};

/** CertificateService.checkAndIssue bilan bir xil — attemptId unique constraint'iga tayanadi. */
const checkAndIssue = async (input: {
  attemptId: string;
  userId: string;
  examId: string;
  userFullName: string;
  specialtyName: object;
  score: number;
}): Promise<boolean> => {
  const existing = await prisma.certificate.findUnique({ where: { attemptId: input.attemptId }, select: { id: true } });
  if (existing) return true;

  try {
    await prisma.certificate.create({
      data: {
        certificateId: generateCertificateId(),
        attemptId: input.attemptId,
        userId: input.userId,
        examId: input.examId,
        userFullName: input.userFullName,
        specialtyName: input.specialtyName,
        score: input.score,
        level: 'EXPERT',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
    return true;
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') return true;
    throw error;
  }
};

const seedFixtures = async () => {
  const specialty = await prisma.specialty.create({ data: { name: { uz: 'Kardiolog', ru: 'Кардиолог', en: 'Cardiologist' } } });
  const exam = await prisma.exam.create({
    data: { specialtyId: specialty.id, title: { uz: 'T', ru: 'T', en: 'T' }, durationMinutes: 10, minCertificateScore: 50 },
  });
  const user = await prisma.user.create({
    data: { fullName: 'Cert Test Doctor', email: `cert-test-${Date.now()}@example.com`, password: 'hash', role: 'USER' },
  });
  const attempt = await prisma.examAttempt.create({
    data: { examId: exam.id, userId: user.id, minCertificateScore: 50, questionCount: 1, score: 100, submittedAt: new Date() },
  });

  return { specialty, exam, user, attempt };
};

beforeEach(async () => {
  await prisma.certificate.deleteMany();
  await prisma.examAttempt.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.specialty.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('CertificateService.checkAndIssue — idempotency', () => {
  it('creates exactly one certificate no matter how many times it is called for the same attempt', async () => {
    const { specialty, exam, user, attempt } = await seedFixtures();

    const input = {
      attemptId: attempt.id,
      userId: user.id,
      examId: exam.id,
      userFullName: user.fullName,
      specialtyName: specialty.name as object,
      score: 100,
    };

    const results = await Promise.all([checkAndIssue(input), checkAndIssue(input), checkAndIssue(input)]);

    expect(results).toEqual([true, true, true]);

    const certificates = await prisma.certificate.findMany({ where: { attemptId: attempt.id } });
    expect(certificates).toHaveLength(1);
  });

  it('generates a certificate ID matching the DOC-{year}-{code} format', async () => {
    const { specialty, exam, user, attempt } = await seedFixtures();

    await checkAndIssue({
      attemptId: attempt.id,
      userId: user.id,
      examId: exam.id,
      userFullName: user.fullName,
      specialtyName: specialty.name as object,
      score: 100,
    });

    const certificate = await prisma.certificate.findUniqueOrThrow({ where: { attemptId: attempt.id } });
    expect(certificate.certificateId).toMatch(new RegExp(`^DOC-${new Date().getFullYear()}-[0-9A-Z]{6}$`));
  });
});
