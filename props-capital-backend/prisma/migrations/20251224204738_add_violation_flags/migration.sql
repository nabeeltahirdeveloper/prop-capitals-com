-- AlterTable
ALTER TABLE "TradingAccount" ADD COLUMN     "dailyLossViolated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "drawdownViolated" BOOLEAN NOT NULL DEFAULT false;

-- Initialize existing accounts: set violation flags based on current status
-- If account is DAILY_LOCKED, set dailyLossViolated to true
UPDATE "TradingAccount" 
SET "dailyLossViolated" = true
WHERE "status" = 'DAILY_LOCKED';

-- If account is DISQUALIFIED, set drawdownViolated to true
UPDATE "TradingAccount" 
SET "drawdownViolated" = true
WHERE "status" = 'DISQUALIFIED';
