import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SEED_USERS = [
  {
    email: 'admin1@prop-capitals.com',
    password: 'Admin1@12345',
    role: UserRole.ADMIN,
    profile: {
      firstName: 'Admin',
      lastName: 'One',
      country: 'United Kingdom',
      timezone: 'UTC',
    },
  },
  {
    email: 'admin2@prop-capitals.com',
    password: 'Admin2@12345',
    role: UserRole.ADMIN,
    profile: {
      firstName: 'Admin',
      lastName: 'Two',
      country: 'United Kingdom',
      timezone: 'UTC',
    },
  },
  {
    email: 'admin3@prop-capitals.com',
    password: 'Admin3@12345',
    role: UserRole.ADMIN,
    profile: {
      firstName: 'Admin',
      lastName: 'Three',
      country: 'United Kingdom',
      timezone: 'UTC',
    },
  },
];

async function seedAdmins() {
  console.log('🌱 Seeding additional admin credentials...');

  for (const seed of SEED_USERS) {
    const existing = await prisma.user.findUnique({
      where: { email: seed.email },
      include: { profile: true },
    });

    if (existing) {
      console.log(`✓ User already exists: ${seed.email} (${existing.role})`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(seed.password, 10);

    const user = await prisma.user.create({
      data: {
        email: seed.email,
        password: hashedPassword,
        role: seed.role,
        profile: {
          create: seed.profile,
        },
        notificationPreference: {
          create: {},
        },
      },
    });

    console.log(`✓ Created ${user.role}: ${user.email} (password: ${seed.password})`);
  }

  console.log('✅ Admin credentials seeded successfully!');
  console.log('');
  console.log('🔑 Login credentials:');
  for (const seed of SEED_USERS) {
    console.log(`   ${seed.role.padEnd(7)} → ${seed.email} / ${seed.password}`);
  }
}

seedAdmins()
  .catch((e) => {
    console.error('❌ Error seeding admins:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
