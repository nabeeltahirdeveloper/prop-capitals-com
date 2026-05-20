// Exports the Xoala request/response record for support hand-off.
// Usage:
//   node scripts/export-xoala-log.js                -> lists 5 most recent Xoala payments
//   node scripts/export-xoala-log.js XOALA-...-xxxx  -> full report for one reference
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const ref = process.argv[2];

  if (!ref) {
    const recent = await prisma.payment.findMany({
      where: { provider: 'xoala' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        reference: true,
        status: true,
        orderStatus: true,
        amount: true,
        currency: true,
        createdAt: true,
        callbackPayload: true,
      },
    });
    console.log('Most recent Xoala payments:\n');
    for (const p of recent) {
      console.log(
        `${p.reference} | status=${p.status} | orderStatus=${p.orderStatus ?? '-'} | ` +
          `${(p.amount / 100).toFixed(2)} ${p.currency} | callback=${p.callbackPayload ? 'YES' : 'none'} | ${p.createdAt.toISOString()}`,
      );
    }
    console.log('\nRun again with a reference to get the full report.');
    await prisma.$disconnect();
    return;
  }

  const p = await prisma.payment.findUnique({ where: { reference: ref } });
  if (!p) {
    console.log(`No payment found for reference ${ref}`);
    await prisma.$disconnect();
    return;
  }

  console.log(
    JSON.stringify(
      {
        merchantTransactionId: p.reference,
        provider: p.provider,
        merchantStatus: p.status,
        gatewayOrderStatus: p.orderStatus,
        gatewayPaymentId: p.providerPaymentId,
        failureReason: p.failureReason,
        amount: `${(p.amount / 100).toFixed(2)} ${p.currency}`,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        REQUEST_sent_to_xoala: p.sessionPayload,
        RESPONSE_from_xoala_callback: p.callbackPayload,
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
})();
