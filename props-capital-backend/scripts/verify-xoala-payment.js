// Verify a Xoala payment's full DB state — Payment + User + TradingAccount.
// Usage: node scripts/verify-xoala-payment.js [XOALA-...-xxxx]   (omits = latest)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const refArg = process.argv[2];
  const payment = await prisma.payment.findFirst({
    where: refArg ? { reference: refArg } : { provider: 'xoala' },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { include: { profile: true } },
      challenge: true,
    },
  });

  if (!payment) {
    console.log('No payment found.');
    await prisma.$disconnect();
    return;
  }

  const account = payment.tradingAccountId
    ? await prisma.tradingAccount.findUnique({ where: { id: payment.tradingAccountId } })
    : null;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PAYMENT RECORD');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log({
    id:                payment.id,
    reference:         payment.reference,
    status:            payment.status,
    orderStatus:       payment.orderStatus,
    provider:          payment.provider,
    providerPaymentId: payment.providerPaymentId,
    amount:            `${(payment.amount / 100).toFixed(2)} ${payment.currency}`,
    failureReason:     payment.failureReason,
    createdAt:         payment.createdAt,
    updatedAt:         payment.updatedAt,
    tradingAccountId:  payment.tradingAccountId,
  });

  console.log('\nMETADATA (card summary):');
  console.log((payment.metadata || {}).card);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('USER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log({
    id:          payment.user.id,
    email:       payment.user.email,
    firstName:   payment.user.profile?.firstName,
    lastName:    payment.user.profile?.lastName,
    passwordSet: payment.user.passwordSet,
    createdAt:   payment.user.createdAt,
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('CHALLENGE BOUGHT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log({
    id:           payment.challenge.id,
    name:         payment.challenge.name,
    accountSize:  payment.challenge.accountSize,
    challengeType:payment.challenge.challengeType,
    price:        payment.challenge.price,
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TRADING ACCOUNT (auto-provisioned)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (account) {
    console.log({
      id:             account.id,
      platform:       account.platform,
      status:         account.status,
      phase:          account.phase,
      initialBalance: account.initialBalance,
      balance:        account.balance,
      equity:         account.equity,
      createdAt:      account.createdAt,
    });
    console.log('\n✅ Trading account exists — provisioning succeeded.');
  } else {
    console.log('❌ No trading account linked to this payment.');
  }

  await prisma.$disconnect();
})();
