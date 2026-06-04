import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from '../src/email/email.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [EmailService],
})
class TestEmailModule {}

async function main() {
  const [, , toArg, nameArg, amountArg, currencyArg, invoiceArg] = process.argv;

  if (!toArg) {
    console.error(
      'Missing recipient. Usage:\n  npx ts-node scripts/test-receipt-email.ts you@example.com [name] [amount] [currency] [invoice#]',
    );
    process.exit(1);
  }

  const challengeName = nameArg || '1-Step Challenge - €25K Challenge';
  const amount = amountArg ? Number(amountArg) : 189;
  const currency = currencyArg || 'EUR';
  const invoiceNumber = invoiceArg ? Number(invoiceArg) : 1;

  if (Number.isNaN(amount) || amount <= 0) {
    console.error(`Invalid amount: ${amountArg}`);
    process.exit(1);
  }
  if (Number.isNaN(invoiceNumber) || invoiceNumber < 0) {
    console.error(`Invalid invoice number: ${invoiceArg}`);
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(TestEmailModule, {
    logger: ['error', 'warn', 'log'],
  });
  const email = app.get(EmailService);

  console.log(
    `Sending receipt to ${toArg} (${currency} ${amount.toFixed(2)}, #${invoiceNumber}, "${challengeName}")...`,
  );

  const result = await email.sendPurchaseReceiptEmail({
    to: toArg,
    challengeName,
    amount,
    currency,
    invoiceNumber,
  });

  console.log('Result:', JSON.stringify(result, null, 2));

  await app.close();
}

main().catch((e) => {
  console.error('Failed:', e);
  process.exit(1);
});
