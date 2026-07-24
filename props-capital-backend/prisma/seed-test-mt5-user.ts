import {
  PrismaClient,
  UserRole,
  ChallengePlatform,
  TradingPhase,
  TradingAccountStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function seedTestMt5User() {
  console.log('🌱 Seeding test MT5 user + trading account...');

  // Use simple, operator-friendly credentials as requested
  const email = 'latest-test@prop-capitals.com';
  const password = 'latest@123';
  // Use the same credentials for MT5 login/password per request
  const mt5Login = email;
  const mt5Password = password;

  try {
    // 1) Create or find a BrokerServer entry for MT5
    let broker = await prisma.brokerServer.findFirst({
      where: { host: 'mt5.test.local' },
    });
    if (!broker) {
      broker = await prisma.brokerServer.create({
        data: {
          name: 'MT5 Test Server',
          platform: ChallengePlatform.MT5,
          host: 'mt5.test.local',
          port: 443,
          description: 'Seeded test MT5 broker server',
        },
      });
      console.log(`✓ Created BrokerServer id=${broker.id}`);
    } else {
      console.log(
        `✓ Reusing BrokerServer id=${broker.id} (host=${broker.host})`,
      );
    }

    // 2) Find an active MT5 Challenge (fallback: create one)
    let challenge = await prisma.challenge.findFirst({
      where: { platform: ChallengePlatform.MT5, isActive: true },
    });
    if (!challenge) {
      challenge = await prisma.challenge.create({
        data: {
          name: 'Seed MT5 Test Challenge',
          accountSize: 50000,
          price: 1,
          platform: ChallengePlatform.MT5,
          platforms: [ChallengePlatform.MT5],
          isActive: true,
          phase1TargetPercent: 8.0,
          phase2TargetPercent: 5.0,
          dailyDrawdownPercent: 5.0,
          overallDrawdownPercent: 10.0,
        },
      });
      console.log(`✓ Created Challenge id=${challenge.id}`);
    } else {
      console.log(`✓ Reusing Challenge id=${challenge.id} (${challenge.name})`);
    }

    // 3) Create or update the user with the requested simple credentials
    const hashedPassword = await bcrypt.hash(password, 10);
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Update existing user's password to the requested value
      user = await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      console.log(`✓ Reused existing user and updated password: ${email}`);
    } else {
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: UserRole.TRADER,
          profile: {
            create: {
              firstName: 'Seed',
              lastName: 'Tester',
              country: 'GB',
              timezone: 'UTC',
            },
          },
          notificationPreference: { create: {} },
        },
      });
      console.log(`✓ Created user: ${email}`);
    }

    // 4) Create a TradingAccount for the user with MT5 creds
    const platformHashedPassword = await bcrypt.hash(mt5Password, 10);

    // 4) Create or update a TradingAccount for the user with MT5 creds
    let account = await prisma.tradingAccount.findFirst({
      where: {
        userId: user.id,
        challengeId: challenge.id,
        platform: ChallengePlatform.MT5,
      },
    });

    if (account) {
      account = await prisma.tradingAccount.update({
        where: { id: account.id },
        data: {
          brokerLogin: mt5Login,
          brokerPassword: mt5Password,
          platformEmail: email,
          brokerServerId: broker.id,
          platformHashedPassword,
          status: TradingAccountStatus.ACTIVE,
        },
      });
      console.log(
        `✓ Updated TradingAccount id=${account.id} (brokerLogin=${mt5Login})`,
      );
    } else {
      account = await prisma.tradingAccount.create({
        data: {
          userId: user.id,
          challengeId: challenge.id,
          phase: TradingPhase.PHASE1,
          status: TradingAccountStatus.ACTIVE,
          balance: 0,
          equity: 0,
          brokerLogin: mt5Login,
          brokerPassword: mt5Password,
          platformEmail: email,
          brokerServerId: broker.id,
          initialBalance: Number(challenge.accountSize ?? 50000),
          platform: ChallengePlatform.MT5,
          platformHashedPassword,
        },
      });
      console.log(
        `✓ Created TradingAccount id=${account.id} (brokerLogin=${mt5Login})`,
      );
    }

    // 5) Output credentials (capture them securely after running)
    console.log('\n🔑 Test credentials (capture & rotate):');
    console.log(`  User email: ${user.email}`);
    console.log(`  User password (plaintext): ${password}`);
    console.log(`  MT5 login: ${mt5Login}`);
    console.log(`  MT5 password (plaintext): ${mt5Password}`);
    console.log('');
    console.log('Notes:');
    console.log(
      '- Platform hashed password stored in `platformHashedPassword` (bcrypt).',
    );
    console.log('- BrokerServer host used: mt5.test.local');
    console.log('- Remove or rotate these credentials when finished.');
  } catch (err) {
    console.error('❌ Error seeding test MT5 user:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestMt5User()
  .catch((e) => {
    console.error('❌ Unhandled error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
