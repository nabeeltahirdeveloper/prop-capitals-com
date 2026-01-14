import { Logger } from '@nestjs/common';

const logger = new Logger('EnvValidation');

/**
 * Validate required environment variables at startup
 * Fails fast if critical vars are missing
 */
export function validateEnvironment() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
  ];

  const recommended = [
    'SENDGRID_API_KEY',
    'SENDGRID_FROM',
  ];

  const missing: string[] = [];
  const missingRecommended: string[] = [];

  // Check required vars
  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check recommended vars
  for (const varName of recommended) {
    if (!process.env[varName]) {
      missingRecommended.push(varName);
    }
  }

  // Fail fast if critical vars missing
  if (missing.length > 0) {
    logger.error(`❌ CRITICAL: Missing required environment variables: ${missing.join(', ')}`);
    logger.error('Application cannot start. Please set these variables in .env file.');
    process.exit(1);
  }

  // Warn about recommended vars
  if (missingRecommended.length > 0) {
    logger.warn(`⚠️  Missing recommended environment variables: ${missingRecommended.join(', ')}`);
    logger.warn('Some features may not work correctly.');
  }

  // Validate JWT_SECRET strength (optional but good practice)
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    logger.warn('⚠️  JWT_SECRET is shorter than 32 characters. Consider using a longer secret for better security.');
  }

  logger.log('✅ Environment variables validated');
}
