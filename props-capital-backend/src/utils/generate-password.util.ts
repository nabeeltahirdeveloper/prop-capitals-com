import { randomBytes } from 'node:crypto';

export function generatePassword(length: number = 8): string {
  // Define the allowed characters
  const chars =
    'abcdefghijklmnopqrstuvwxyz'
    + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    + '0123456789'
    + '!@#$%^&*()-_=+[]{};:,.?/';
  const max = chars.length;

  // Build password by mapping random bytes to indices in the chars set
  let password = '';
  const bytes = randomBytes(length);

  for (let i = 0; i < length; i++) {
    // Use modulo to pick a character; modulo preserves uniformity for cryptographic randomness
    password += chars[bytes[i] % max];
  }

  return password;
}
