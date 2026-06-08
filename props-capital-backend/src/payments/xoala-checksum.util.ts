import * as crypto from 'crypto';

const md5 = (input: string): string =>
  crypto.createHash('md5').update(input).digest('hex');

// S2S transaction request checksum:
//   MD5( memberId | secureKey | merchantTransactionId | amount )
export function buildXoalaRequestChecksum(args: {
  memberId: string;
  secureKey: string;
  merchantTransactionId: string;
  amount: string;
}): string {
  return md5(
    [
      args.memberId,
      args.secureKey,
      args.merchantTransactionId,
      args.amount,
    ].join('|'),
  );
}

// Callback/notification checksum (verified in webhook.service.ts):
//   MD5( paymentId | merchantTransactionId | amount | status | secureKey )
export function buildXoalaCallbackChecksum(args: {
  paymentId: string;
  merchantTransactionId: string;
  amount: string;
  status: string;
  secureKey: string;
}): string {
  return md5(
    [
      args.paymentId,
      args.merchantTransactionId,
      args.amount,
      args.status,
      args.secureKey,
    ].join('|'),
  );
}
