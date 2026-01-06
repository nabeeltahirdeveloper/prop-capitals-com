-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TradingAccountStatus" ADD VALUE 'DAILY_LOCKED';
ALTER TYPE "TradingAccountStatus" ADD VALUE 'DISQUALIFIED';

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TradingAccount" ADD COLUMN     "dailyLockedUntil" TIMESTAMP(3),
ADD COLUMN     "maxEquityToDate" DOUBLE PRECISION,
ADD COLUMN     "todayStartEquity" DOUBLE PRECISION;

-- Initialize existing accounts: set todayStartEquity and maxEquityToDate to equity (or initialBalance if equity is null)
UPDATE "TradingAccount" 
SET "todayStartEquity" = COALESCE("equity", "initialBalance"),
    "maxEquityToDate" = COALESCE("equity", "initialBalance")
WHERE "todayStartEquity" IS NULL OR "maxEquityToDate" IS NULL;
