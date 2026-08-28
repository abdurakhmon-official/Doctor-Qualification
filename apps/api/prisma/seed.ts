import { PrismaClient, USER_ROLE } from '../generated/prisma';
import { hashPassword } from '../modules/auth';

const prisma = new PrismaClient();

/** Mutaxassisliklar — reference/lookup ma'lumot (rule: api standards.md §13), barcha muhitda qo'lda seed qilinadi. */
const SPECIALTIES = [
  { uz: 'Terapevt', ru: 'Терапевт', en: 'General practitioner' },
  { uz: 'Kardiolog', ru: 'Кардиолог', en: 'Cardiologist' },
  { uz: 'Nevrolog', ru: 'Невролог', en: 'Neurologist' },
  { uz: 'Jarroh', ru: 'Хирург', en: 'Surgeon' },
  { uz: 'Pediatr', ru: 'Педиатр', en: 'Pediatrician' },
  { uz: 'Stomatolog', ru: 'Стоматолог', en: 'Dentist' },
  { uz: 'Dermatolog', ru: 'Дерматолог', en: 'Dermatologist' },
  { uz: 'Ginekolog', ru: 'Гинеколог', en: 'Gynecologist' },
  { uz: 'Urolog', ru: 'Уролог', en: 'Urologist' },
];

const seedSpecialties = async (): Promise<void> => {
  const existing = await prisma.specialty.count();
  if (existing > 0) return;

  await prisma.specialty.createMany({
    data: SPECIALTIES.map((name, order) => ({ name, order })),
  });

  console.info(`[seed] specialties ready: ${SPECIALTIES.length}`);
};

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
  await seedSpecialties();
  await seedAdmin();
};

main()
  .catch((error) => {
    console.error('[seed] error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
