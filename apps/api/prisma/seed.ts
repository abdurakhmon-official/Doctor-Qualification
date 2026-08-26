import { PrismaClient, USER_ROLE } from '../generated/prisma';
import { hashPassword } from '../modules/auth';

const prisma = new PrismaClient();

const seedAdmin = async (): Promise<void> => {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('[seed] SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD not set — admin not created');
    return;
  }

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      fullName: 'Admin',
      password: await hashPassword(password),
      role: USER_ROLE.ADMIN,
      emailVerified: true,
    },
  });

  console.info(`[seed] admin ready: ${email}`);
};

const main = async (): Promise<void> => {
  await seedAdmin();
};

main()
  .catch((error) => {
    console.error('[seed] error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
